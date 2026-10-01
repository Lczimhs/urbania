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

export const MODO_TESTE = true;

// "joao.silva@email.com" -> "Joao Silva"
const nomeDoEmail = (email: string) =>
  email.split('@')[0].split(/[._-]+/).filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join(' ') || 'Visitante';

const usuarioDeTeste = (email: string, data?: { nome?: string; cargo?: string }): AuthUser => ({
  id: 0,
  nome: data?.nome || nomeDoEmail(email),
  email: email || 'visitante@urbania.com.br',
  cargo: data?.cargo || 'Administrador',
});

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

  // PERÍODO DE TESTES: qualquer e-mail e senha entram.
  // Se o e-mail existir no banco, usa o nome/cargo reais; se não existir, a senha estiver errada,
  // for corretor ou o backend estiver fora do ar, entra como usuário de teste.
  // Para voltar a exigir login de verdade, troque MODO_TESTE para false.
  const login = async (email: string, senha: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, senha }, { timeout: 4000 });
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        setToken(res.data.token);
        return { success: true };
      }
      return { success: false, error: 'Resposta inesperada do servidor.' };
    } catch (err: any) {
      const data = err.response?.data;
      if (MODO_TESTE) {
        setUser(usuarioDeTeste(email, data));
        setToken('modo_teste');
        return { success: true };
      }
      if (err.response?.status === 403 && data?.bloqueado) {
        return { success: false, bloqueado: true, error: data.error || 'Acesso Negado: Corretores não possuem acesso ao sistema interno.' };
      }
      return { success: false, error: data?.error || err.message || 'Falha ao realizar login. Tente novamente.' };
    } finally {
      setLoading(false);
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
