import { api } from './axios';
import type { User } from '../store/authStore';

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export const loginApi = async (data: any) => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const registerApi = async (data: any) => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const getUserStatsApi = async () => {
  const response = await api.get<{ success: boolean; stats: any }>('/auth/stats');
  return response.data.stats;
};
