import axios from 'axios';

export const api = axios.create({
  // Em desenvolvimento, "/api" é repassado pelo Vite para o backend (ver vite.config.ts)
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Interceptor para injetar token e identificação de usuário
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('urbania_token');
    const userStr = localStorage.getItem('urbania_user');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (userStr) {
      const user = JSON.parse(userStr);
      config.headers['x-user'] = user.email || user.nome;
      config.headers['x-user-cargo'] = user.cargo;
    }
  } catch {
    // ignorar falha ao ler storage
  }
  return config;
});
