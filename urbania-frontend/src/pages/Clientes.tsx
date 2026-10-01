import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { Badge, Card, DataTable, FilterSelect, PageHeader, RowActions, SearchInput, Toolbar, matches } from '../components/DataTable';
import { Avatar } from '../components/EntityForm';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage, RelatedGrid } from '../components/EntityPage';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { maskCpfCnpj, maskPhone, maskRg, onlyDigits } from '../lib/masks';
import { formatCurrency, formatDate } from '../lib/format';
import {
  ESTADOS_CIVIS, FINALIDADES_BUSCA, ORIGENS_CLIENTE, SEXOS, TIPOS_CLIENTE, TIPOS_IMOVEL_BUSCA, addressFields, statusColor,
} from '../lib/options';

const tipoColor = (tipo: string) =>
  tipo === 'Locatário' ? 'bg-amber-100 text-amber-700' : tipo === 'Interessado' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700';

// Consultar Clientes
export function ClientesList() {
  const navigate = useNavigate();
  const { rows, loading, reload } = useList('clientes');
  const [term, setTerm] = useState('');
  const [tipo, setTipo] = useState('');
  const [origem, setOrigem] = useState('');
  const del = useDelete('clientes', 'Cliente', reload);

  const filtered = rows.filter(c =>
    matches(term, c.nome, c.email, c.telefone, onlyDigits(c.telefone)) &&
    (!tipo || c.tipo === tipo) && (!origem || c.origem === origem));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clientes" subtitle={`${rows.length} cadastros`}
        action={<button onClick={() => navigate('/clientes/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c]"><Plus size={18} /> Novo Cliente</button>}
      />
      <Card>
        <Toolbar>
          <SearchInput value={term} onChange={setTerm} placeholder="Buscar por nome, e-mail ou telefone..." />
          <FilterSelect value={tipo} onChange={setTipo} options={TIPOS_CLIENTE} placeholder="Todos os tipos" />
          <FilterSelect value={origem} onChange={setOrigem} options={ORIGENS_CLIENTE} placeholder="Todas as origens" />
        </Toolbar>
        <DataTable
          rows={filtered} loading={loading}
          onRowClick={r => navigate(`/clientes/${r.id}`)}
          columns={[
            { key: 'nome', label: 'Nome', render: r => (
              <div className="flex items-center gap-3">
                <Avatar src={r.foto} name={r.nome} size="sm" />
                <span className="font-semibold text-slate-800">{r.nome}</span>
              </div>
            ) },
            { key: 'email', label: 'E-mail', render: r => <span className="text-slate-600">{r.email || '-'}</span> },
            { key: 'telefone', label: 'Telefone', render: r => <span className="text-slate-600 font-medium">{r.telefone || '-'}</span> },
            { key: 'tipo', label: 'Tipo', render: r => r.tipo && <Badge className={tipoColor(r.tipo)}>{r.tipo}</Badge> },
            { key: 'origem', label: 'Origem', className: 'text-slate-500' },
          ]}
          actions={r => (
            <RowActions onView={() => navigate(`/clientes/${r.id}`)} onEdit={() => navigate(`/clientes/${r.id}/editar`)} onDelete={() => del.ask(r.id, r.nome)} />
          )}
        />
      </Card>
      {del.modal}
    </div>
  );
}

const tabs: TabDef[] = [
  { label: 'Dados Básicos', fields: [
    { key: 'foto', label: 'Foto do Cliente', type: 'photo', full: true },
    { key: 'nome', label: 'Nome Completo', required: true, full: true },
    { key: 'telefone', label: 'Telefone', mask: maskPhone, placeholder: '(00) 00000-0000', required: true },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'origem', label: 'Origem', type: 'select', options: ORIGENS_CLIENTE },
    { key: 'tipo', label: 'Tipo de Cliente', type: 'select', options: TIPOS_CLIENTE },
    { key: 'rg', label: 'RG', mask: maskRg },
  ] },
  { label: 'Dados Pessoais', fields: [
    { key: 'cpfCnpj', label: 'CPF/CNPJ', mask: maskCpfCnpj, placeholder: '000.000.000-00', required: true },
    { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date' },
    { key: 'sexo', label: 'Sexo', type: 'select', options: SEXOS },
    { key: 'estadoCivil', label: 'Estado Civil', type: 'select', options: ESTADOS_CIVIS },
    { key: 'profissao', label: 'Profissão' },
    { key: 'renda', label: 'Renda Mensal', type: 'currency' },
  ] },
  { label: 'Endereço', fields: addressFields() },
  { label: 'Perfil de Busca', fields: [
    { key: 'finalidade', label: 'Finalidade', type: 'select', options: FINALIDADES_BUSCA },
    { key: 'tipoImovelBusca', label: 'Tipo de Imóvel', type: 'select', options: TIPOS_IMOVEL_BUSCA },
    { key: 'areaMinima', label: 'Área Mínima', type: 'number', suffix: 'm²' },
    { key: 'bairroBusca', label: 'Bairro Ideal' },
    { key: 'faixaMin', label: 'Faixa de Preço (mínimo)', type: 'currency' },
    { key: 'faixaMax', label: 'Faixa de Preço (máximo)', type: 'currency' },
    { key: 'quartosBusca', label: 'Mínimo de Quartos', type: 'number' },
    { key: 'banheirosBusca', label: 'Mínimo de Banheiros', type: 'number' },
    { key: 'observacoes', label: 'Observações', type: 'textarea' },
  ] },
];

// Históricos exibidos na visualização/edição (somente leitura)
function ClienteHistorico({ clienteId }: { clienteId: number }) {
  const navigate = useNavigate();
  const visitas = useList('visitas', { clienteId });
  const negociacoes = useList('negociacoes', { clienteId });
  const contratos = useList('contratos', { clienteId });
  const imoveis = useList('imoveis');
  const imovel = (id: number) => imoveis.rows.find(i => i.id === id);

  return (
    <>
      <RelatedGrid title="Contratos Vinculados">
        <DataTable
          compact
          rows={contratos.rows} loading={contratos.loading} empty="Nenhum contrato vinculado a este cliente."
          columns={[
            { key: 'id', label: 'ID Contrato', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'imovel', label: 'Imóvel', render: r => imovel(r.imovelId)?.titulo || r.imovelTitulo || `#${r.imovelId}` },
            { key: 'tipo', label: 'Tipo', render: r => <span className="font-semibold text-xs">{r.tipo}</span> },
            { key: 'vigencia', label: 'Início Vigência', render: r => formatDate(r.dataInicio) },
            { key: 'valor', label: 'Valor', render: r => formatCurrency(r.valor) },
            { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={r => <button type="button" onClick={() => navigate(`/contratos/${r.id}`)} className="inline-flex items-center gap-1 text-sky-600 font-semibold text-xs hover:underline"><Eye size={14} /> Visualizar</button>}
        />
      </RelatedGrid>
      <RelatedGrid title="Histórico de Visitas">
        <DataTable
          compact
          rows={visitas.rows} loading={visitas.loading} empty="Nenhuma visita registrada."
          columns={[
            { key: 'id', label: 'ID da Visita', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'imovel', label: 'Imóvel', render: r => imovel(r.imovelId)?.titulo || `#${r.imovelId}` },
            { key: 'data', label: 'Data', render: r => formatDate(r.data) },
            { key: 'cep', label: 'CEP do Imóvel', render: r => imovel(r.imovelId)?.cep },
            { key: 'tipo', label: 'Tipo do Imóvel', render: r => imovel(r.imovelId)?.tipo },
          ]}
          actions={r => <button type="button" onClick={() => navigate(`/visitas/${r.id}`)} className="inline-flex items-center gap-1 text-sky-600 font-semibold text-xs hover:underline"><Eye size={14} /> Visualizar</button>}
        />
      </RelatedGrid>
      <RelatedGrid title="Histórico de Negociações">
        <DataTable
          compact
          rows={negociacoes.rows} loading={negociacoes.loading} empty="Nenhuma negociação registrada."
          columns={[
            { key: 'id', label: 'ID da Proposta', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'data', label: 'Data', render: r => formatDate(r.data) },
            { key: 'valor', label: 'Valor Proposto', render: r => formatCurrency(r.valor) },
            { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={r => <button type="button" onClick={() => navigate(`/negociacoes/${r.id}`)} className="inline-flex items-center gap-1 text-sky-600 font-semibold text-xs hover:underline"><Eye size={14} /> Visualizar</button>}
        />
      </RelatedGrid>
    </>
  );
}

// Cadastrar / Visualizar / Editar Cliente
export function ClientePage({ mode }: { mode: Mode }) {
  return (
    <EntityPage
      mode={mode} entity="clientes" basePath="/clientes" singular="Cliente" tabs={tabs}
      defaults={{ tipo: 'Comprador', origem: 'Indicação' }}
      validate={f => {
        const doc = onlyDigits(f.cpfCnpj).length;
        if (doc !== 11 && doc !== 14) return 'CPF/CNPJ inválido: informe 11 dígitos (CPF) ou 14 dígitos (CNPJ).';
        if (onlyDigits(f.telefone).length < 10) return 'Telefone inválido: informe DDD + número.';
        if (f.faixaMin && f.faixaMax && f.faixaMin > f.faixaMax) return 'A faixa de preço mínima não pode ser maior que a máxima.';
        return null;
      }}
      extraTabs={[{ label: 'Históricos', render: f => <ClienteHistorico clienteId={f.id} /> }]}
    />
  );
}
