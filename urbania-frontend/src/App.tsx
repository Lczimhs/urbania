import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ComponentType } from 'react';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
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
import GenericCrud from './pages/GenericCrud';

// Gera as 4 rotas de um módulo: consultar, cadastrar, visualizar e editar
const crudRoutes = (base: string, List: ComponentType, Page: ComponentType<{ mode: Mode }>) => [
  <Route key={base} path={base} element={<List />} />,
  <Route key={`${base}-novo`} path={`${base}/novo`} element={<Page mode="create" />} />,
  <Route key={`${base}-ver`} path={`${base}/:id`} element={<Page mode="view" />} />,
  <Route key={`${base}-editar`} path={`${base}/:id/editar`} element={<Page mode="edit" />} />,
];

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
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

            {/* Auditoria de Acessos e Logs */}
            <Route path="/auditoria" element={<GenericCrud entity="auditoria" title="Auditoria de Acessos" fields={[{key:'usuario',label:'Usuário'},{key:'acao',label:'Ação'},{key:'data',label:'Data'}]} />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  )
}
