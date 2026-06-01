import axios from 'axios';

/**
 * Global Axios Client
 * 
 * Centralizes API configuration.
 * Interceptors automatically attach the JWT token from localStorage
 * to every outbound request so we don't have to manually pass it.
 */
export const api = axios.create({
  // Use VITE_API_URL if set, else fallback to local backend port
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
