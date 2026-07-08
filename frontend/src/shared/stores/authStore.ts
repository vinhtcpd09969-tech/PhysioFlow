import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string | null;
  vai_tro_id: number;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  updateAccessToken: (accessToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      showAuthModal: false,
      setShowAuthModal: (show) => set({ showAuthModal: show }),
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      updateUser: (updatedFields) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedFields } : null
      })),
      updateAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// ─── High-performance selector hooks ────────────────────────────────────────

/** Subscribe ONLY to user changes. */
export const useUser = () => useAuthStore((state) => state.user);

/** Subscribe ONLY to accessToken changes. */
export const useAccessToken = () => useAuthStore((state) => state.accessToken);

/** Subscribe ONLY to refreshToken changes. */
export const useRefreshToken = () => useAuthStore((state) => state.refreshToken);

/** Derived hook — true/false based on accessToken presence. */
export const useIsAuthenticated = () => useAuthStore((state) => !!state.accessToken);

/** Returns stable action functions — components using this never re-render on data changes. */
export const useAuthActions = () => {
  return useAuthStore((state) => ({
    setAuth: state.setAuth,
    updateUser: state.updateUser,
    updateAccessToken: state.updateAccessToken,
    logout: state.logout,
  }));
};

export const useIsAuthenticatedFunc = () => useAuthStore((state) => state.isAuthenticated);
