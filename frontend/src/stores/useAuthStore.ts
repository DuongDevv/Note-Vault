import { clearAuthToken, fetchUserProfile, getAuthToken, type AuthUser } from "@/services/auth";
import { create } from "zustand";

interface AuthState {
  currentUser: AuthUser | null;
  isAuthLoading: boolean;
  initSession: () => Promise<void>;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthLoading: Boolean(getAuthToken()),
  async initSession() {
    if (!getAuthToken()) return;
    try {
      const user = await fetchUserProfile();
      set({ currentUser: user });
    } catch {
      set({ currentUser: null });
    } finally {
      set({ isAuthLoading: false });
    }
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  logout() {
    clearAuthToken();
    set({ currentUser: null });
  },
}));
