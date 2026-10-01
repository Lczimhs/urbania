import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  telefone?: string;
  foto?: string;
  perfilId?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string; bloqueado?: boolean }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const STORAGE_USER_KEY = 'urbania_user';
const STORAGE_TOKEN_KEY = 'urbania_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_TOKEN_KEY) || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  }, [token]);

  const login = async (email: string, senha: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, senha });
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        setToken(res.data.token);
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: 'Resposta inesperada do servidor.' };
    } catch (err: any) {
      setLoading(false);
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.bloqueado) {
        return {
          success: false,
          bloqueado: true,
          error: data.error || 'Acesso Negado: Corretores não possuem acesso ao sistema interno.',
        };
      }
      const msg = data?.error || err.message || 'Falha ao realizar login. Tente novamente.';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
