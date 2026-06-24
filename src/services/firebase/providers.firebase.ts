import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseDb } from '@/firebase/db';
import { callFirebaseFunction } from '@/firebase/functions';
import { getFirebaseStorage } from '@/firebase/storage';
import { contactConverter, providerConverter, userConverter } from '@/firebase/converters';
import type { ProviderPhoto, ProviderProfile } from '@/types/provider';
import type {
  ProviderProfileUpdateInput,
  ProvidersService,
} from '../contracts/providers.contract';

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
}

function requireFirebaseStorage() {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error('error.firebase.notConfigured');
  return storage;
}

async function uploadProfilePhoto(providerId: string, file: File) {
  const storage = requireFirebaseStorage();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectRef = ref(storage, `providerPhotos/${providerId}/${Date.now()}-${safeName}`);
  await uploadBytes(objectRef, file, { contentType: file.type });
  return getDownloadURL(objectRef);
}

function safeProviderPatch(
  current: ProviderProfile,
  patch: ProviderProfileUpdateInput,
  uploadedPhotoUrl?: string,
): Partial<ProviderProfile> {
  return {
    displayName: patch.displayName ?? current.displayName,
    bio: patch.bio ?? current.bio,
    profession: patch.profession ?? current.profession,
    whatsappNumber: patch.whatsappNumber ?? current.whatsappNumber,
    whatsappVisible: patch.whatsappVisible ?? current.whatsappVisible,
    photos: uploadedPhotoUrl
      ? [
          {
            id: `photo-${Date.now()}`,
            url: uploadedPhotoUrl,
            alt: `${current.displayName} profile photo`,
          } satisfies ProviderPhoto,
          ...current.photos,
        ]
      : (patch.photos ?? current.photos),
  };
}

export const firebaseProvidersService: ProvidersService = {
  getProviderById: async (id) => {
    const db = requireFirebaseDb();
    const snapshot = await getDoc(doc(db, 'providers', id).withConverter(providerConverter));
    if (!snapshot.exists()) return null;
    const provider = snapshot.data();
    if (provider.status !== 'approved') return null;
    const owner = await getDoc(doc(db, 'users', provider.userId).withConverter(userConverter));
    if (owner.data()?.status === 'banned') return null;
    return provider;
  },
  getProviderForOwner: async (userId) => {
    const db = requireFirebaseDb();
    const directSnapshot = await getDoc(
      doc(db, 'providers', userId).withConverter(providerConverter),
    );
    if (directSnapshot.exists()) return directSnapshot.data();

    const ownerSnapshot = await getDocs(
      query(
        collection(db, 'providers').withConverter(providerConverter),
        where('userId', '==', userId),
        limit(1),
      ),
    );
    return ownerSnapshot.docs[0]?.data() ?? null;
  },
  incrementProfileView: async (providerId, viewerId) => {
    const db = requireFirebaseDb();
    const provider = await getDoc(
      doc(db, 'providers', providerId).withConverter(providerConverter),
    );
    if (!provider.exists() || provider.data().userId === viewerId) return;

    const key = `profile-viewed-${providerId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'true');

    try {
      await callFirebaseFunction<{ providerId: string; dedupeKey: string }, void>('trackProfileView', {
        providerId,
        dedupeKey: key,
      });
    } catch {
      // Profile viewing must not break read-only profile access if rules deny analytics writes.
    }
  },
  revealWhatsApp: async (customerId, providerId) => {
    return callFirebaseFunction<{ providerId: string }, Awaited<ReturnType<ProvidersService['revealWhatsApp']>>>(
      'revealWhatsApp',
      { providerId },
    );
  },
  reportProvider: async (reporterId, providerId, reason) => {
    await callFirebaseFunction<{ providerId: string; reason: string }, void>('reportProvider', { providerId, reason });
  },
  updateProviderProfile: async (providerId, patch) => {
    const db = requireFirebaseDb();
    const providerRef = doc(db, 'providers', providerId).withConverter(providerConverter);
    const snapshot = await getDoc(providerRef);
    if (!snapshot.exists()) throw new Error('error.provider.notFound');

    const provider = snapshot.data();
    const uploadedPhotoUrl = patch.profilePhotoFile
      ? await uploadProfilePhoto(providerId, patch.profilePhotoFile)
      : undefined;
    const update = safeProviderPatch(provider, patch, uploadedPhotoUrl);
    await updateDoc(doc(db, 'providers', providerId), update);
    return { ...provider, ...update };
  },
  providerContacts: async (providerId) => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(
        collection(db, 'contacts').withConverter(contactConverter),
        where('providerId', '==', providerId),
      ),
    );
    return snapshot.docs.map((item) => item.data());
  },
};
