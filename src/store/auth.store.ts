import type { ProviderStatus } from '@/types/provider';
import type { AppUser } from '@/types/user';
import type { AuthSession } from '@/services/contracts/auth.contract';
import { create } from 'zustand';
import * as authService from '@/services/auth.service';

interface AuthState {
  user: AppUser | null;
  providerStatus?: ProviderStatus;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<AuthSession>;
  loginWithGoogle: () => Promise<AuthSession>;
  logout: () => Promise<void>;
  setSession: (user: AppUser | null, providerStatus?: ProviderStatus) => void;
}

let unsubscribeAuthSession: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  providerStatus: undefined,
  isLoading: false,
  isInitialized: false,
  initialize: async () => {
    set({ isLoading: true });
    if (!unsubscribeAuthSession) {
      unsubscribeAuthSession = authService.subscribeToSession((session) => {
        set({ ...session, isLoading: false, isInitialized: true });
      });
      return;
    }

    const session = await authService.getCurrentSession();
    set({ ...session, isLoading: false, isInitialized: true });
  },
  login: async (identifier, password) => {
    set({ isLoading: true });
    try {
      const session = await authService.login(identifier, password);
      set({ ...session, isLoading: false, isInitialized: true });
      return session;
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      throw error;
    }
  },
  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const session = await authService.loginWithGoogle();
      set({ ...session, isLoading: false, isInitialized: true });
      return session;
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      throw error;
    }
  },
  logout: async () => {
    await authService.logout();
    set({ user: null, providerStatus: undefined, isInitialized: true });
  },
  setSession: (user, providerStatus) =>
    set({ user, providerStatus, isInitialized: true }),
}));
