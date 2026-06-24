import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firebaseAuthService, resolveLoginEmail } from './auth.firebase';

const authMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  sendEmailVerification: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

const firestoreMocks = vi.hoisted(() => ({
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
}));

const firebaseUser = {
  uid: 'created-provider',
  email: 'created@example.test',
  displayName: null,
};

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: authMocks.createUserWithEmailAndPassword,
  deleteUser: authMocks.deleteUser,
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendEmailVerification: authMocks.sendEmailVerification,
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: authMocks.signOut,
  updateProfile: authMocks.updateProfile,
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_, path: string) => ({ path, withConverter() { return this; } })),
  deleteDoc: firestoreMocks.deleteDoc,
  doc: vi.fn((_, path: string, id: string) => ({
    path: `${path}/${id}`,
    withConverter() {
      return this;
    },
  })),
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
  limit: vi.fn(),
  query: vi.fn(),
  setDoc: firestoreMocks.setDoc,
  where: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock('@/firebase/auth', () => ({
  getFirebaseAuth: () => ({ currentUser: firebaseUser }),
}));

vi.mock('@/firebase/db', () => ({
  getFirebaseDb: () => ({}),
}));

vi.mock('@/firebase/storage', () => ({
  getFirebaseStorage: () => null,
}));

describe('firebase auth identifier resolution', () => {
  it('does not query private user docs for phone identifiers', async () => {
    await expect(resolveLoginEmail('+201001112222')).rejects.toThrow('error.auth.invalidCredentials');
  });

  it('accepts email identifiers directly', async () => {
    await expect(resolveLoginEmail(' user@example.test ')).resolves.toBe('user@example.test');
  });
});

describe('firebase provider registration rollback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: firebaseUser,
    });
    authMocks.sendEmailVerification.mockResolvedValue(undefined);
    authMocks.updateProfile.mockResolvedValue(undefined);
    authMocks.deleteUser.mockResolvedValue(undefined);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
    firestoreMocks.setDoc
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('provider write failed'));
  });

  it('removes the just-created account when provider profile creation fails', async () => {
    await expect(
      firebaseAuthService.registerProvider({
        displayName: 'Created Provider',
        email: 'created@example.test',
        password: 'password',
        phone: '+201001112222',
        profession: 'plumbing',
        serviceArea: 'new-cairo',
        whatsappNumber: '+201001112222',
        identityDocument: {
          fileName: 'national-id.pdf',
          fileType: 'application/pdf',
          fileSize: 128,
          uploadedAt: new Date().toISOString(),
        },
      }),
    ).rejects.toThrow('provider write failed');

    expect(authMocks.deleteUser).toHaveBeenCalledWith(firebaseUser);
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(3);
    expect(
      firestoreMocks.deleteDoc.mock.calls.map(([ref]) => ref.path),
    ).toEqual([
      'providerIdentityDocuments/created-provider',
      'providers/created-provider',
      'users/created-provider',
    ]);
  });
});
