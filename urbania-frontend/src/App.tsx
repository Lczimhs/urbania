
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import GenericCrud from './pages/GenericCrud';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/proprietarios" element={<GenericCrud entity="proprietarios" title="Gestão de Proprietários" fields={[{key:'nome',label:'Nome'},{key:'cpfCnpj',label:'CPF/CNPJ'},{key:'telefone',label:'Telefone'},{key:'banco',label:'Banco'}]} />} />
          <Route path="/imoveis" element={<GenericCrud entity="imoveis" title="Catálogo de Imóveis" fields={[{key:'titulo',label:'Título'},{key:'tipo',label:'Tipo'},{key:'finalidade',label:'Finalidade'},{key:'precoVenda',label:'Preço Venda'}]} />} />
          <Route path="/visitas" element={<GenericCrud entity="visitas" title="Agenda de Visitas" fields={[{key:'clienteNome',label:'Cliente'},{key:'imovelTitulo',label:'Imóvel'},{key:'data',label:'Data'},{key:'status',label:'Status'}]} />} />
          <Route path="/funcionarios" element={<GenericCrud entity="funcionarios" title="Funcionários" fields={[{key:'nome',label:'Nome'},{key:'cargo',label:'Cargo'},{key:'status',label:'Status'}]} />} />
          <Route path="/perfis" element={<GenericCrud entity="perfis" title="Perfis de Acesso" fields={[{key:'nome',label:'Perfil'},{key:'descricao',label:'Descrição'}]} />} />
          <Route path="/notificacoes" element={<GenericCrud entity="notificacoes" title="Notificações" fields={[{key:'titulo',label:'Título'},{key:'canal',label:'Canal'},{key:'status',label:'Status'}]} />} />
          <Route path="/prestadores" element={<GenericCrud entity="prestadores" title="Prestadores de Serviço" fields={[{key:'nome',label:'Nome'},{key:'especialidade',label:'Especialidade'}]} />} />
          <Route path="/reparos" element={<GenericCrud entity="reparos" title="Gestão de Reparos" fields={[{key:'descricao',label:'Descrição'},{key:'status',label:'Status'},{key:'valor',label:'Valor'}]} />} />
          <Route path="/anuncios" element={<GenericCrud entity="anuncios" title="Canais de Anúncios" fields={[{key:'canal',label:'Canal'},{key:'status',label:'Status'}]} />} />
          <Route path="/despesas" element={<GenericCrud entity="despesas" title="Controle de Despesas" fields={[{key:'descricao',label:'Descrição'},{key:'valor',label:'Valor'},{key:'status',label:'Status'}]} />} />
          <Route path="/multas" element={<GenericCrud entity="multas" title="Gestão de Multas" fields={[{key:'motivo',label:'Motivo'},{key:'valor',label:'Valor'},{key:'status',label:'Status'}]} />} />
          <Route path="/financeiro" element={<GenericCrud entity="financeiro" title="Operações Financeiras" fields={[{key:'tipo',label:'Tipo'},{key:'descricao',label:'Descrição'},{key:'valor',label:'Valor'},{key:'status',label:'Status'}]} />} />
          <Route path="/auditoria" element={<GenericCrud entity="auditoria" title="Auditoria de Acessos" fields={[{key:'usuario',label:'Usuário'},{key:'acao',label:'Ação'},{key:'data',label:'Data'}]} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
