import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the HTTP-only JWT cookie
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('plantpanda_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('plantpanda_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
