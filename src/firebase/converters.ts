import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from 'firebase/firestore';
import type { AdminAction, AbuseReport } from '@/types/admin';
import type { Contact } from '@/types/contact';
import type { Conversation, Message } from '@/types/messaging';
import type { Profession, ProviderIdentityDocument, ProviderProfile } from '@/types/provider';
import type { Review } from '@/types/review';
import type { AppUser } from '@/types/user';
import type { VisibilityRequest } from '@/types/visibility';
import { convertIsoFieldsToTimestamps, convertTimestampFieldsToIso } from './timestamps';
import {
  computeCoverageAreaKeys,
  getPlatformCoverageRadiusKm,
} from '@/lib/provider-coverage';

type TimestampField<T> = Extract<keyof T, string>;

function stripClientId<T extends object>(data: WithFieldValue<T>, idField: string) {
  const output = { ...(data as Record<string, unknown>) };
  delete output[idField];
  return output;
}

export function createFirestoreConverter<T extends object>(
  timestampFields: readonly TimestampField<T>[],
  idField: TimestampField<T> = 'id' as TimestampField<T>,
): FirestoreDataConverter<T> {
  const idFieldName = String(idField);

  return {
    toFirestore(modelObject: WithFieldValue<T>): DocumentData {
      return convertIsoFieldsToTimestamps(
        stripClientId(modelObject, idFieldName),
        timestampFields as readonly string[],
      );
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      const data = convertTimestampFieldsToIso(
        snapshot.data(options),
        timestampFields as readonly string[],
      );
      return {
        [idFieldName]: snapshot.id,
        ...data,
      } as T;
    },
  };
}

export const userConverter = createFirestoreConverter<AppUser>(['createdAt'], 'uid');
const providerTimestampFields = [
  'visibilityPaidUntil',
  'paidVisibilityStartedAt',
  'paidVisibilityHoldUntil',
  'rankingPenaltyUntil',
  'verificationReviewedAt',
  'createdAt',
  'approvedAt',
] as const;

export const providerConverter: FirestoreDataConverter<ProviderProfile> = {
  toFirestore(modelObject: WithFieldValue<ProviderProfile>): DocumentData {
    return convertIsoFieldsToTimestamps(
      stripClientId(modelObject, 'id'),
      providerTimestampFields,
    );
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ProviderProfile {
    const data = convertTimestampFieldsToIso(
      snapshot.data(options),
      providerTimestampFields,
    ) as Partial<ProviderProfile>;
    const serviceAreaKeys = data.serviceAreaKeys ?? data.serviceAreas?.map((area) => area.neighborhood) ?? [];
    const coverageRadiusKm = getPlatformCoverageRadiusKm({
      city: data.serviceAreas?.[0]?.city,
      profession: data.profession,
      serviceAreaKey: data.initialServiceAreaKey ?? serviceAreaKeys[0],
    });
    return {
      ...(data as ProviderProfile),
      id: snapshot.id,
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
  },
};
export const providerIdentityDocumentConverter =
  createFirestoreConverter<ProviderIdentityDocument>(['uploadedAt']);
export const professionConverter = createFirestoreConverter<Profession>([]);
export const contactConverter = createFirestoreConverter<Contact>(['createdAt']);
export const conversationConverter = createFirestoreConverter<Conversation>(['lastMessageAt']);
export const messageConverter = createFirestoreConverter<Message>(['createdAt']);
export const reviewConverter = createFirestoreConverter<Review>(['createdAt']);
export const adminActionConverter = createFirestoreConverter<AdminAction>(['createdAt']);
export const abuseReportConverter = createFirestoreConverter<AbuseReport>(['createdAt', 'resolvedAt']);
export const visibilityRequestConverter = createFirestoreConverter<VisibilityRequest>([
  'requestedAt',
  'processedAt',
  'disclosureAcceptedAt',
]);
