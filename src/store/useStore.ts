import { create } from 'zustand';
import { VegvisrUser } from '../types';
import {
  getUserFromLocalStorage,
  saveUserToLocalStorage,
  logoutVegvisrUser,
  verifyAndAuthenticateMagicToken,
} from '../utils/vegvisrAuth';

export interface AuthState {
  user: VegvisrUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;

  // Actions
  login: (user: VegvisrUser, token?: string) => void;
  logout: () => void;
  checkMagicLinkOnMount: () => Promise<void>;
  setAuthError: (err: string | null) => void;
}

const initialUser = getUserFromLocalStorage();
const initialToken = initialUser?.emailVerificationToken || (typeof window !== 'undefined' ? localStorage.getItem('emailVerificationToken') : null);

export const useStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialToken || null,
  isAuthenticated: !!initialUser,
  isLoading: false,
  authError: null,

  login: (user: VegvisrUser, token?: string) => {
    const finalToken = token || user.emailVerificationToken || 'auth-token-' + Date.now();
    const fullUser = { ...user, emailVerificationToken: finalToken };
    saveUserToLocalStorage(fullUser);
    set({
      user: fullUser,
      token: finalToken,
      isAuthenticated: true,
      authError: null,
    });
  },

  logout: () => {
    logoutVegvisrUser();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      authError: null,
    });
  },

  setAuthError: (err: string | null) => {
    set({ authError: err });
  },

  checkMagicLinkOnMount: async () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const magicToken = params.get('magic');

    if (magicToken) {
      set({ isLoading: true, authError: null });
      try {
        const user = await verifyAndAuthenticateMagicToken(magicToken);
        set({
          user,
          token: user.emailVerificationToken,
          isAuthenticated: true,
          isLoading: false,
        });
        // Clean up URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err: any) {
        console.error('Magic link verification error:', err);
        set({
          isLoading: false,
          authError: err.message || 'Magic link token verification failed or expired.',
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  },
}));
