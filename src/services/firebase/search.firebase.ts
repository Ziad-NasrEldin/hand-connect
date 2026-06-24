import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { professions as seededProfessions } from '@/config/professions';
import { getFirebaseConfig } from '@/firebase/app';
import { getFirebaseDb } from '@/firebase/db';
import { professionConverter } from '@/firebase/converters';
import { rankProviders } from '@/lib/ranking';
import { providerCoversNeighborhood } from '@/lib/provider-coverage';
import {
  computeCoverageAreaKeys,
  getPlatformCoverageRadiusKm,
} from '@/lib/provider-coverage';
import { maxSearchLimit } from '@/lib/search-filters';
import type { ProviderProfile } from '@/types/provider';
import type { SearchService } from '../contracts/search.contract';

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
}

type FirestoreRestValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreRestValue[] };
  mapValue?: { fields?: Record<string, FirestoreRestValue> };
};

type FirestoreRunQueryRow = {
  document?: {
    name: string;
    fields?: Record<string, FirestoreRestValue>;
  };
};

function decodeFirestoreValue(value: FirestoreRestValue): unknown {
  if ('stringValue' in value) return value.stringValue ?? '';
  if ('integerValue' in value) return Number(value.integerValue ?? 0);
  if ('doubleValue' in value) return value.doubleValue ?? 0;
  if ('booleanValue' in value) return value.booleanValue ?? false;
  if ('timestampValue' in value) return value.timestampValue ?? null;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    return value.arrayValue?.values?.map(decodeFirestoreValue) ?? [];
  }
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue?.fields ?? {}).map(([key, item]) => [
        key,
        decodeFirestoreValue(item),
      ]),
    );
  }
  return undefined;
}

function decodeProvider(row: FirestoreRunQueryRow): ProviderProfile | null {
  if (!row.document) return null;
  const fields = row.document.fields ?? {};
  const data = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]),
  ) as Partial<ProviderProfile>;
  const id = row.document.name.split('/').at(-1);
  if (!id) return null;
  const serviceAreaKeys = data.serviceAreaKeys ?? data.serviceAreas?.map((area) => area.neighborhood) ?? [];
  const coverageRadiusKm = getPlatformCoverageRadiusKm({
    city: data.serviceAreas?.[0]?.city,
    profession: data.profession,
    serviceAreaKey: data.initialServiceAreaKey ?? serviceAreaKeys[0],
  });
  return {
    ...(data as ProviderProfile),
    id,
    serviceAreaKeys,
    initialServiceAreaKey: data.initialServiceAreaKey ?? serviceAreaKeys[0] ?? '',
    coverageRadiusKm,
    coverageAreaKeys: data.coverageAreaKeys?.length
      ? data.coverageAreaKeys
      : computeCoverageAreaKeys(serviceAreaKeys, coverageRadiusKm),
    paidVisibilityStartedAt: data.paidVisibilityStartedAt ?? null,
    activeVisibilityRequestId: data.activeVisibilityRequestId ?? null,
    activeVisibilityProductId: data.activeVisibilityProductId ?? null,
    activeVisibilityProductVersion: data.activeVisibilityProductVersion ?? null,
    paidVisibilityHoldUntil: data.paidVisibilityHoldUntil ?? null,
    rankingPenalty: data.rankingPenalty ?? 0,
    rankingPenaltyUntil: data.rankingPenaltyUntil ?? null,
    verificationStatus: data.verificationStatus ?? (data.nationalIdVerified ? 'verified' : 'submitted'),
    verificationReviewedAt: data.verificationReviewedAt ?? null,
    verificationReviewedBy: data.verificationReviewedBy ?? null,
    verificationNotes: data.verificationNotes ?? null,
  };
}

async function searchProvidersViaRest(input: {
  profession: string;
  neighborhood: string;
}) {
  const config = getFirebaseConfig();
  if (!config?.projectId || !config.apiKey) throw new Error('error.firebase.notConfigured');
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:runQuery?key=${config.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'providers' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: 'status' },
                  op: 'EQUAL',
                  value: { stringValue: 'approved' },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'ownerStatus' },
                  op: 'EQUAL',
                  value: { stringValue: 'active' },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'profession' },
                  op: 'EQUAL',
                  value: { stringValue: input.profession },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'coverageAreaKeys' },
                  op: 'ARRAY_CONTAINS',
                  value: { stringValue: input.neighborhood },
                },
              },
            ],
          },
        },
        limit: maxSearchLimit,
      },
    }),
  });
  if (!response.ok) throw new Error('error.search.failed');
  const rows = (await response.json()) as FirestoreRunQueryRow[];
  return rows.map(decodeProvider).filter((provider): provider is ProviderProfile => Boolean(provider));
}

export const firebaseSearchService: SearchService = {
  listProfessions: async () => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(
        collection(db, 'professions').withConverter(professionConverter),
        where('active', '==', true),
        orderBy('sortOrder', 'asc'),
      ),
    );
    const firestoreProfessions = snapshot.docs.map((item) => item.data());
    return firestoreProfessions.length > 0
      ? firestoreProfessions
      : seededProfessions.filter((item) => item.active);
  },
  searchProviders: async (input) => {
    const candidates = (await searchProvidersViaRest(input))
      .filter((provider) => provider.ownerStatus === 'active')
      .filter((provider) => providerCoversNeighborhood(provider, input.neighborhood));
    return rankProviders(
      candidates,
      input,
    ).slice(0, input.limit);
  },
};
