import {
  collection,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { professions as seededProfessions } from '@/config/professions';
import { getFirebaseDb } from '@/firebase/db';
import { professionConverter, providerConverter } from '@/firebase/converters';
import { rankProviders } from '@/lib/ranking';
import { providerCoversNeighborhood } from '@/lib/provider-coverage';
import { maxSearchLimit } from '@/lib/search-filters';
import type { SearchService } from '../contracts/search.contract';

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
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
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(
        collection(db, 'providers').withConverter(providerConverter),
        where('status', '==', 'approved'),
        where('profession', '==', input.profession),
        where('coverageAreaKeys', 'array-contains', input.neighborhood),
        orderBy('avgRating', 'desc'),
        firestoreLimit(maxSearchLimit),
      ),
    );
    const candidates = snapshot.docs
      .map((item) => item.data())
      .filter((provider) => provider.ownerStatus === 'active')
      .filter((provider) => providerCoversNeighborhood(provider, input.neighborhood));
    return rankProviders(
      candidates,
      input,
    ).slice(0, input.limit);
  },
};
