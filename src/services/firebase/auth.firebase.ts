import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  deleteDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseAuth } from '@/firebase/auth';
import { getFirebaseDb } from '@/firebase/db';
import { getFirebaseStorage } from '@/firebase/storage';
import { providerConverter, providerIdentityDocumentConverter, userConverter } from '@/firebase/converters';
import { nowIso } from '@/lib/dates';
import { computeCoverageAreaKeys, getPlatformCoverageRadiusKm } from '@/lib/provider-coverage';
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
  if (user.status === 'banned') {
    await signOut(requireFirebaseAuth());
    throw new Error('error.auth.accountBanned');
  }
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

async function createAppUser(
  input: RegisterCustomerInput,
  role: UserRole,
): Promise<{ user: AppUser; emailVerificationSent: boolean }> {
  const auth = requireFirebaseAuth();
  const db = requireFirebaseDb();
  let firebaseUser: User | null = null;
  try {
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    firebaseUser = credential.user;
    await updateProfile(credential.user, { displayName: input.displayName });
    const emailVerificationSent = await sendEmailVerification(credential.user)
      .then(() => true)
      .catch(() => false);

    const user: AppUser = {
      uid: credential.user.uid,
      email: input.email,
      role,
      status: 'active',
      banReason: null,
      bannedAt: null,
      bannedBy: null,
      displayName: input.displayName,
      phone: input.phone,
      language: 'ar',
      createdAt: nowIso(),
    };
    await setDoc(doc(db, 'users', user.uid).withConverter(userConverter), user);
    return { user, emailVerificationSent };
  } catch (error) {
    await cleanupCreatedFirebaseUser(firebaseUser);
    throw mapFirebaseAuthError(error);
  }
}

async function cleanupCreatedFirebaseUser(firebaseUser: User | null) {
  if (!firebaseUser) return;
  await deleteUser(firebaseUser).catch(async () => {
    await signOut(requireFirebaseAuth()).catch(() => undefined);
  });
}

async function rollbackAppRegistration(userId: string) {
  const db = requireFirebaseDb();
  await Promise.allSettled([
    deleteDoc(doc(db, 'providerIdentityDocuments', userId)),
    deleteDoc(doc(db, 'providers', userId)),
    deleteDoc(doc(db, 'users', userId)),
  ]);
  const currentUser = requireFirebaseAuth().currentUser;
  if (currentUser?.uid === userId) {
    await cleanupCreatedFirebaseUser(currentUser);
  }
}

export async function resolveLoginEmail(identifier: string) {
  if (identifier.includes('@')) return identifier.trim();
  throw new Error('error.auth.invalidCredentials');
}

async function ensureOAuthCustomer(firebaseUser: User): Promise<void> {
  const db = requireFirebaseDb();
  const userRef = doc(db, 'users', firebaseUser.uid).withConverter(userConverter);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) return;

  const user: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    role: 'customer',
    status: 'active',
    banReason: null,
    bannedAt: null,
    bannedBy: null,
    displayName: firebaseUser.displayName ?? 'Customer',
    phone: '',
    language: 'ar',
    createdAt: nowIso(),
  };
  await setDoc(userRef, user);
}

function optionalFirebaseStorage() {
  if (import.meta.env.VITE_FIREBASE_STORAGE_ENABLED !== 'true') return null;
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
  const coverageRadiusKm = getPlatformCoverageRadiusKm({
    city: 'cairo',
    profession: input.profession,
    serviceAreaKey: input.serviceArea,
  });
  const provider: ProviderProfile = {
    id: user.uid,
    userId: user.uid,
    ownerStatus: 'active',
    displayName: input.displayName,
    phone: input.phone,
    profession: input.profession,
    bio: '',
    nationalIdVerified: false,
    status: 'pending',
    serviceAreas: [{ neighborhood: input.serviceArea, city: 'cairo' }],
    serviceAreaKeys: [input.serviceArea],
    initialServiceAreaKey: input.serviceArea,
    coverageRadiusKm,
    coverageAreaKeys: computeCoverageAreaKeys([input.serviceArea], coverageRadiusKm),
    whatsappNumber: input.whatsappNumber,
    whatsappVisible: true,
    visibilityTier: 'organic',
    visibilityPaidUntil: null,
    paidVisibilityStartedAt: null,
    activeVisibilityRequestId: null,
    activeVisibilityProductId: null,
    activeVisibilityProductVersion: null,
    paidVisibilityHoldUntil: null,
    rankingPenalty: 0,
    rankingPenaltyUntil: null,
    verificationStatus: 'submitted',
    verificationReviewedAt: null,
    verificationReviewedBy: null,
    verificationNotes: null,
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
      void buildSession(firebaseUser)
        .then(onSession)
        .catch(() => onSession({ user: null, providerStatus: undefined }));
    }),
  login: async (identifier, password) => {
    try {
      const email = await resolveLoginEmail(identifier);
      const credential = await signInWithEmailAndPassword(requireFirebaseAuth(), email, password);
      return buildSession(credential.user);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  },
  loginWithGoogle: async () => {
    try {
      const credential = await signInWithPopup(requireFirebaseAuth(), new GoogleAuthProvider());
      await ensureOAuthCustomer(credential.user);
      return buildSession(credential.user);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  },
  logout: async () => signOut(requireFirebaseAuth()),
  registerCustomer: async (input) => {
    const { user, emailVerificationSent } = await createAppUser(input, 'customer');
    return { user, providerStatus: undefined, emailVerificationSent };
  },
  registerProvider: async (input) => {
    const { user, emailVerificationSent } = await createAppUser(input, 'provider');
    try {
      await createProviderProfile(user, input);
      return { ...(await buildSession(requireFirebaseAuth().currentUser)), emailVerificationSent };
    } catch (error) {
      await rollbackAppRegistration(user.uid);
      throw mapFirebaseAuthError(error);
    }
  },
};
