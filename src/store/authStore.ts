import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

/**
 * Global Authentication Store using Zustand
 * 
 * We use the persist middleware to automatically save the user and token
 * to localStorage. This prevents the user state from becoming null when
 * the browser is refreshed!
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // key in localStorage
    }
  )
);
