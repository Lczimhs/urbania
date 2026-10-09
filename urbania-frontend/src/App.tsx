import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import type { Mode } from './components/EntityForm';
import Dashboard from './pages/Dashboard';
import { ClientePage, ClientesList } from './pages/Clientes';
import { ProprietarioPage, ProprietariosList } from './pages/Proprietarios';
import { ImovelPage, ImoveisList } from './pages/Imoveis';
import { VisitaPage, VisitasList } from './pages/Visitas';
import { FuncionarioPage, FuncionariosList } from './pages/Funcionarios';
import { NegociacaoPage, NegociacoesList } from './pages/Negociacoes';
import { ContratoPage, ContratosList } from './pages/Contratos';
import { ServicoPage, ServicosList } from './pages/Servicos';
import { PrestadorPage, PrestadoresList } from './pages/Prestadores';
import { ReparoPage, ReparosList } from './pages/Reparos';
import { CanalPage, CanaisList } from './pages/Canais';
import { AnuncioPage, AnunciosList } from './pages/Anuncios';
import { NotificacaoPage, NotificacoesList } from './pages/Notificacoes';
import { FinanceiroPage, FinanceiroList } from './pages/Financeiro';
import { PerfilPage, PerfisList } from './pages/Perfis';
import { MultaPage, MultasList } from './pages/Multas';
import { DespesaPage, DespesasList } from './pages/Despesas';
import Relatorios from './pages/Relatorios';
import Auditoria from './pages/Auditoria';
import Configuracoes from './pages/Configuracoes';
import Avisos from './pages/Avisos';
import Perfil from './pages/Perfil';
import { ConfigProvider } from './lib/config';
import { acaoDaRota, moduloDaRota } from './lib/permissoes';

const ACAO_TEXTO = { Visualizar: 'visualizar', Criar: 'cadastrar', Editar: 'editar', Excluir: 'excluir' };

function AcessoNegado({ acao }: { acao: keyof typeof ACAO_TEXTO }) {
  return (
    <div className="max-w-lg mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center"><ShieldAlert size={28} /></div>
      <h1 className="mt-4 text-xl font-bold text-slate-800">Acesso negado</h1>
      <p className="mt-2 text-sm text-slate-500">Seu perfil de acesso não permite {ACAO_TEXTO[acao]} neste módulo. Se precisar, procure a administração da imobiliária.</p>
      <Link to="/" className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-[#0a2540] text-white font-semibold hover:bg-[#06182c]">Voltar ao painel</Link>
    </div>
  );
}

// Gera as 4 rotas de um módulo: consultar, cadastrar, visualizar e editar
const crudRoutes = (base: string, List: ComponentType, Page: ComponentType<{ mode: Mode }>) => [
  <Route key={base} path={base} element={<List />} />,
  <Route key={`${base}-novo`} path={`${base}/novo`} element={<Page mode="create" />} />,
  <Route key={`${base}-ver`} path={`${base}/:id`} element={<Page mode="view" />} />,
  <Route key={`${base}-editar`} path={`${base}/:id/editar`} element={<Page mode="edit" />} />,
];

function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const { isAuthenticated, loading, pode } = useAuth();

  // A tela de login é exibida sem o Layout de painel
  if (loc.pathname === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071b2f] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></span>
          <span className="text-sm font-medium">Carregando painel Urbânia...</span>
        </div>
      </div>
    );
  }

  // Redireciona para o login caso não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Bloqueia a tela quando o perfil não tem a permissão exigida pela rota (ex.: /clientes/novo exige "Criar")
  const modulo = moduloDaRota(loc.pathname);
  const acao = acaoDaRota(loc.pathname);
  const permitido = !modulo || pode(modulo, acao);

  // Usuário autenticado da imobiliária acessa com Layout
  return <ConfigProvider><Layout>{permitido ? children : <AcessoNegado acao={acao} />}</Layout></ConfigProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppShell>
            <Routes>
              {/* Rota pública de Autenticação */}
              <Route path="/login" element={<Login />} />

              {/* Rotas Privadas (Imobiliária) */}
              <Route path="/" element={<Dashboard />} />
              {crudRoutes('/clientes', ClientesList, ClientePage)}
              {crudRoutes('/proprietarios', ProprietariosList, ProprietarioPage)}
              {crudRoutes('/imoveis', ImoveisList, ImovelPage)}
              {crudRoutes('/visitas', VisitasList, VisitaPage)}
              {crudRoutes('/negociacoes', NegociacoesList, NegociacaoPage)}
              {crudRoutes('/contratos', ContratosList, ContratoPage)}
              {crudRoutes('/funcionarios', FuncionariosList, FuncionarioPage)}

              {/* Gestão Financeira e Comunicação (RF F72 / F13-F16) */}
              {crudRoutes('/financeiro', FinanceiroList, FinanceiroPage)}
              {crudRoutes('/notificacoes', NotificacoesList, NotificacaoPage)}
              <Route path="/relatorios" element={<Relatorios />} />

              {/* Manutenção e Divulgação */}
              {crudRoutes('/servicos', ServicosList, ServicoPage)}
              {crudRoutes('/prestadores', PrestadoresList, PrestadorPage)}
              {crudRoutes('/reparos', ReparosList, ReparoPage)}
              {crudRoutes('/canais', CanaisList, CanalPage)}
              {crudRoutes('/anuncios', AnunciosList, AnuncioPage)}

              {/* Gestão Financeira, Multas e Despesas */}
              {crudRoutes('/despesas', DespesasList, DespesaPage)}
              {crudRoutes('/multas', MultasList, MultaPage)}

              {/* Administração e Perfis de Acesso */}
              {crudRoutes('/perfis', PerfisList, PerfilPage)}

              {/* Sistema */}
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/avisos" element={<Avisos />} />
              <Route path="/perfil" element={<Perfil />} />

              {/* Auditoria do Sistema */}
              <Route path="/auditoria" element={<Auditoria />} />

              {/* Redirecionamento padrão */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
