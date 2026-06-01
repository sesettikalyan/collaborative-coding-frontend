import { create } from 'zustand';

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
 * Zustand is significantly lighter and easier to use than Redux.
 * This stores our global user session state.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  // If we have a token on load, we assume authenticated until proven otherwise
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  setUser: (user) => set({ user }),
}));
