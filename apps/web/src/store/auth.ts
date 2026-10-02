import { create } from 'zustand';

interface AuthState {
  user: { id: string; email?: string | null; phone?: string | null; name: string | null; role: string } | null;
  token: string | null;
  login: (user: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
