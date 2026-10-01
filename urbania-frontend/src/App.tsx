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

            {/* Manutenção e Divulgação */}
            {crudRoutes('/servicos', ServicosList, ServicoPage)}
            {crudRoutes('/prestadores', PrestadoresList, PrestadorPage)}
            {crudRoutes('/reparos', ReparosList, ReparoPage)}
            {crudRoutes('/canais', CanaisList, CanalPage)}
            {crudRoutes('/anuncios', AnunciosList, AnuncioPage)}

            {/* Módulos ainda no CRUD genérico (a desenvolver conforme o Documento de Requisitos) */}
            <Route path="/perfis" element={<GenericCrud entity="perfis" title="Perfis de Acesso" fields={[{key:'nome',label:'Perfil'},{key:'descricao',label:'Descrição'}]} />} />
            <Route path="/notificacoes" element={<GenericCrud entity="notificacoes" title="Notificações" fields={[{key:'titulo',label:'Título'},{key:'canal',label:'Canal'},{key:'status',label:'Status'}]} />} />
            <Route path="/despesas" element={<GenericCrud entity="despesas" title="Controle de Despesas" fields={[{key:'descricao',label:'Descrição'},{key:'valor',label:'Valor'},{key:'status',label:'Status'}]} />} />
            <Route path="/multas" element={<GenericCrud entity="multas" title="Gestão de Multas" fields={[{key:'motivo',label:'Motivo'},{key:'valor',label:'Valor'},{key:'status',label:'Status'}]} />} />
            <Route path="/financeiro" element={<GenericCrud entity="financeiro" title="Operações Financeiras" fields={[{key:'tipo',label:'Tipo'},{key:'descricao',label:'Descrição'},{key:'valor',label:'Valor'},{key:'status',label:'Status'}]} />} />
            <Route path="/auditoria" element={<GenericCrud entity="auditoria" title="Auditoria de Acessos" fields={[{key:'usuario',label:'Usuário'},{key:'acao',label:'Ação'},{key:'data',label:'Data'}]} />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  )
}
