import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  collection,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseAuth } from '@/firebase/auth';
import { getFirebaseDb } from '@/firebase/db';
import { getFirebaseStorage } from '@/firebase/storage';
import { providerConverter, providerIdentityDocumentConverter, userConverter } from '@/firebase/converters';
import { nowIso } from '@/lib/dates';
import type { ProviderIdentityDocument, ProviderProfile, ProviderStatus } from '@/types/provider';
import type { AppUser, UserRole } from '@/types/user';
import type {
  AuthService,
  AuthSession,
  RegisterCustomerInput,
  RegisterProviderInput,
} from '../contracts/auth.contract';

function requireFirebaseAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('error.firebase.notConfigured');
  return auth;
}

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
}

async function buildSession(firebaseUser: User | null): Promise<AuthSession> {
  if (!firebaseUser) return { user: null, providerStatus: undefined };

  const db = requireFirebaseDb();
  const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid).withConverter(userConverter));
  if (!userSnap.exists()) return { user: null, providerStatus: undefined };

  const user = userSnap.data();
  const providerStatus = user.role === 'provider' ? await getProviderStatus(user.uid) : undefined;
  return { user, providerStatus };
}

async function getProviderStatus(userId: string): Promise<ProviderStatus | undefined> {
  const db = requireFirebaseDb();
  const snap = await getDoc(doc(db, 'providers', userId).withConverter(providerConverter));
  if (snap.exists()) return snap.data().status;

  const fallback = await getDocs(
    query(
      collection(db, 'providers').withConverter(providerConverter),
      where('userId', '==', userId),
      limit(1),
    ),
  );
  return fallback.docs[0]?.data().status;
}

async function createAppUser(input: RegisterCustomerInput, role: UserRole): Promise<AppUser> {
  const auth = requireFirebaseAuth();
  const db = requireFirebaseDb();
  try {
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    await updateProfile(credential.user, { displayName: input.displayName });

    const user: AppUser = {
      uid: credential.user.uid,
      email: input.email,
      role,
      displayName: input.displayName,
      phone: input.phone,
      language: 'ar',
      createdAt: nowIso(),
    };
    await setDoc(doc(db, 'users', user.uid).withConverter(userConverter), user);
    return user;
  } catch (error) {
    throw mapFirebaseAuthError(error);
  }
}

function optionalFirebaseStorage() {
  return getFirebaseStorage();
}

async function uploadIdentityDocument(
  providerId: string,
  identityDocument: Omit<ProviderIdentityDocument, 'providerId'>,
) {
  if (!identityDocument.previewDataUrl) return identityDocument;

  const storage = optionalFirebaseStorage();
  if (!storage) {
    return {
      ...identityDocument,
      storageFallback: 'firestore-preview-data-url',
    };
  }

  try {
    const safeName = identityDocument.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectRef = ref(storage, `identityDocuments/${providerId}/${Date.now()}-${safeName}`);
    const blob = await fetch(identityDocument.previewDataUrl).then((response) => response.blob());
    await uploadBytes(objectRef, blob, { contentType: identityDocument.fileType });
    const downloadUrl = await getDownloadURL(objectRef);
    return {
      ...identityDocument,
      storagePath: objectRef.fullPath,
      downloadUrl,
      previewDataUrl: undefined,
    };
  } catch {
    return {
      ...identityDocument,
      storageFallback: 'firestore-preview-data-url',
    };
  }
}

async function createProviderProfile(user: AppUser, input: RegisterProviderInput) {
  const db = requireFirebaseDb();
  const provider: ProviderProfile = {
    id: user.uid,
    userId: user.uid,
    displayName: input.displayName,
    phone: input.phone,
    profession: input.profession,
    bio: '',
    nationalIdVerified: false,
    status: 'pending',
    serviceAreas: [{ neighborhood: input.serviceArea, city: 'cairo' }],
    serviceAreaKeys: [input.serviceArea],
    whatsappNumber: input.whatsappNumber,
    whatsappVisible: true,
    visibilityTier: 'organic',
    visibilityPaidUntil: null,
    profileViews: 0,
    avgRating: 0,
    reviewCount: 0,
    activityScore: 0,
    photos: [],
    createdAt: nowIso(),
    approvedAt: null,
  };
  await setDoc(doc(db, 'providers', provider.id).withConverter(providerConverter), provider);

  const uploadedIdentity = await uploadIdentityDocument(provider.id, input.identityDocument);
  await setDoc(
    doc(db, 'providerIdentityDocuments', provider.id).withConverter(providerIdentityDocumentConverter),
    { ...uploadedIdentity, providerId: provider.id },
  );
}

function mapFirebaseAuthError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/email-already-in-use') return new Error('error.auth.emailExists');
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-email'
  ) {
    return new Error('error.auth.invalidCredentials');
  }
  if (code === 'auth/weak-password') return new Error('error.auth.passwordRequired');
  return error instanceof Error ? error : new Error('error.auth.failed');
}

export const firebaseAuthService: AuthService = {
  getCurrentSession: async () => buildSession(requireFirebaseAuth().currentUser),
  subscribeToSession: (onSession) =>
    onAuthStateChanged(requireFirebaseAuth(), (firebaseUser) => {
      void buildSession(firebaseUser).then(onSession);
    }),
  login: async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(requireFirebaseAuth(), email, password);
      return buildSession(credential.user);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  },
  logout: async () => signOut(requireFirebaseAuth()),
  registerCustomer: async (input) => {
    const user = await createAppUser(input, 'customer');
    return { user, providerStatus: undefined };
  },
  registerProvider: async (input) => {
    const user = await createAppUser(input, 'provider');
    await createProviderProfile(user, input);
    return buildSession(requireFirebaseAuth().currentUser);
  },
};
