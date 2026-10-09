import axios from 'axios';

export const api = axios.create({
  // Em desenvolvimento, "/api" é repassado pelo Vite para o backend (ver vite.config.ts)
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('urbania_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Client-Device'] = localStorage.getItem('urbania_device_name') || 'Pc-Lucas';
  return config;
});

// Usuário não identificado: avisa o AuthProvider, que encerra a sessão e volta ao login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('urbania:sessao-expirada'));
    }
    return Promise.reject(err);
  },
);
