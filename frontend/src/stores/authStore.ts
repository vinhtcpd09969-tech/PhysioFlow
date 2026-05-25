import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  ho_ten: string;
  email: string;
  vai_tro_id: number;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
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
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'auth-storage',
      // Only serialize and persist data fields, ignoring non-serializable action/utility methods
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// --- HIGH-PERFORMANCE SELECTOR HOOKS ---

/**
 * Hook to retrieve user profile. Subscribes ONLY to user changes.
 */
export const useUser = () => useAuthStore((state) => state.user);

/**
 * Hook to retrieve the current accessToken.
 */
export const useAccessToken = () => useAuthStore((state) => state.accessToken);

/**
 * Hook to retrieve the current refreshToken.
 */
export const useRefreshToken = () => useAuthStore((state) => state.refreshToken);

/**
 * Derived Hook to check if authenticated. Subscribes only to accessToken presence changes.
 */
export const useIsAuthenticated = () => useAuthStore((state) => !!state.accessToken);

/**
 * Hook to retrieve state actions. Since action functions are stable,
 * components using this hook will NEVER re-render when user or token data changes.
 */
export const useAuthActions = () => {
  return useAuthStore((state) => ({
    setAuth: state.setAuth,
    updateAccessToken: state.updateAccessToken,
    logout: state.logout,
  }));
};
export const useIsAuthenticatedFunc = () => useAuthStore((state) => state.isAuthenticated);
