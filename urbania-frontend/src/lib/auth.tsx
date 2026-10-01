import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { moduloDaRota } from './permissoes';
import type { Acao, Permissoes } from './permissoes';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  telefone?: string;
  foto?: string;
  perfilId?: number;
  perfilNome?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  permissoes: Permissoes;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string; bloqueado?: boolean }>;
  logout: () => void;
  pode: (modulo: string, acao?: Acao) => boolean;
  isAuthenticated: boolean;
}

// PERÍODO DE TESTES: exibe os botões de acesso rápido na tela de login. Para tirar os botões, troque para false.
// A senha não é conferida: o e-mail define o funcionário (e o perfil); e-mail desconhecido entra como Visitante.
export const MODO_TESTE = true;

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const STORAGE_USER_KEY = 'urbania_user';
const STORAGE_TOKEN_KEY = 'urbania_token';
const STORAGE_PERMISSOES_KEY = 'urbania_permissoes';

const ler = <T,>(chave: string, padrao: T): T => {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : padrao;
  } catch {
    return padrao;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => ler(STORAGE_USER_KEY, null));
  const [permissoes, setPermissoes] = useState<Permissoes>(() => ler(STORAGE_PERMISSOES_KEY, {}));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN_KEY) || null);
  const [loading, setLoading] = useState(false);

  const salvarSessao = (novoToken: string, data: { user: AuthUser; permissoes: Permissoes }) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, novoToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_PERMISSOES_KEY, JSON.stringify(data.permissoes));
    setToken(novoToken);
    setUser(data.user);
    setPermissoes(data.permissoes);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_PERMISSOES_KEY);
    setUser(null);
    setToken(null);
    setPermissoes({});
  }, []);

  // Ao abrir o sistema, busca as permissões atuais (o perfil pode ter sido alterado por um administrador).
  // Usuário que não existe mais no banco faz o interceptor do api.ts encerrar a sessão.
  useEffect(() => {
    if (!token) return;
    api.get('/auth/me')
      .then(r => salvarSessao(token, r.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O api.ts avisa quando o backend responde 401 (usuário não identificado)
  useEffect(() => {
    window.addEventListener('urbania:sessao-expirada', logout);
    return () => window.removeEventListener('urbania:sessao-expirada', logout);
  }, [logout]);

  const login = async (email: string, senha: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, senha }, { timeout: 4000 });
      if (res.data.success && res.data.user) {
        salvarSessao(res.data.token, res.data);
        return { success: true };
      }
      return { success: false, error: 'Resposta inesperada do servidor.' };
    } catch (err: any) {
      const data = err.response?.data;
      if (!err.response) return { success: false, error: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.' };
      return { success: false, error: data?.error || err.message || 'Falha ao realizar login. Tente novamente.' };
    } finally {
      setLoading(false);
    }
  };

  const pode = useCallback((modulo: string, acao: Acao = 'Visualizar') => (permissoes[modulo] || []).includes(acao), [permissoes]);

  return (
    <AuthContext.Provider value={{ user, token, permissoes, loading, login, logout, pode, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Permissão no módulo da página atual (ex.: em /clientes, pode('Criar') vale para clientes).
// Páginas fora da matriz (Painel, Avisos...) liberam tudo: os botões delas apontam para outros módulos.
export function usePodeNaRota() {
  const { pathname } = useLocation();
  const { pode } = useAuth();
  const modulo = moduloDaRota(pathname);
  return (acao: Acao) => (modulo ? pode(modulo, acao) : true);
}

// Mostra o conteúdo só se o usuário tiver a permissão (padrão: módulo da página atual)
export function Pode({ acao, modulo, children }: { acao: Acao; modulo?: string; children: ReactNode }) {
  const { pode } = useAuth();
  const podeNaRota = usePodeNaRota();
  const permitido = modulo ? pode(modulo, acao) : podeNaRota(acao);
  return permitido ? <>{children}</> : null;
}
