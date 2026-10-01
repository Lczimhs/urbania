import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { Badge, Card, DataTable, FilterSelect, PageHeader, RowActions, SearchInput, Toolbar, matches } from '../components/DataTable';
import { Avatar } from '../components/EntityForm';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage, RelatedGrid } from '../components/EntityPage';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { maskCnpj, maskCpf, maskPhone, maskRg, onlyDigits } from '../lib/masks';
import { formatCurrency, formatDate, fullAddress } from '../lib/format';
import { ESTADOS_CIVIS, SEXOS, TIPOS_CONTA, TIPOS_PESSOA, addressFields, statusColor } from '../lib/options';

const documento = (p: Record<string, any>) => (p.tipo === 'Jurídica' ? p.cnpj : p.cpfCnpj);

const searchBy: Record<string, (p: Record<string, any>) => unknown[]> = {
  '': p => [p.id, p.nome, documento(p), onlyDigits(documento(p)), p.tipo],
  id: p => [p.id],
  nome: p => [p.nome],
  documento: p => [documento(p), onlyDigits(documento(p))],
  tipo: p => [p.tipo],
};

// Consultar Proprietários
export function ProprietariosList() {
  const navigate = useNavigate();
  const { rows, loading, reload } = useList('proprietarios');
  const [term, setTerm] = useState('');
  const [campo, setCampo] = useState('');
  const del = useDelete('proprietarios', 'Proprietário', reload);

  const filtered = rows.filter(p => matches(term, ...searchBy[campo](p)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Proprietários" subtitle={`${rows.length} cadastros`}
        action={<button onClick={() => navigate('/proprietarios/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c]"><Plus size={18} /> Novo Proprietário</button>}
      />
      <Card>
        <Toolbar>
          <FilterSelect value={campo} onChange={setCampo} placeholder="Buscar em todos os campos"
            options={[{ value: 'id', label: 'ID' }, { value: 'nome', label: 'Nome' }, { value: 'documento', label: 'CPF/CNPJ' }, { value: 'tipo', label: 'Tipo de Pessoa' }]} />
          <SearchInput value={term} onChange={setTerm} placeholder="Digite para filtrar..." />
        </Toolbar>
        <DataTable
          rows={filtered} loading={loading}
          onRowClick={r => navigate(`/proprietarios/${r.id}`)}
          columns={[
            { key: 'nome', label: 'Nome', render: r => (
              <div className="flex items-center gap-3">
                <Avatar src={r.foto} name={r.nome} size="sm" />
                <span className="font-semibold text-slate-800">{r.nome}</span>
              </div>
            ) },
            { key: 'email', label: 'E-mail', render: r => <span className="text-slate-600">{r.email || '-'}</span> },
            { key: 'telefone', label: 'Telefone', render: r => <span className="text-slate-600 font-medium">{r.telefone || '-'}</span> },
            { key: 'documento', label: 'CPF/CNPJ', render: documento },
            { key: 'tipo', label: 'Tipo', render: r => r.tipo && <Badge className={r.tipo === 'Jurídica' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'}>{r.tipo}</Badge> },
          ]}
          actions={r => (
            <RowActions onView={() => navigate(`/proprietarios/${r.id}`)} onEdit={() => navigate(`/proprietarios/${r.id}/editar`)} onDelete={() => del.ask(r.id, r.nome)} />
          )}
        />
      </Card>
      {del.modal}
    </div>
  );
}

const juridica = (f: Record<string, any>) => f.tipo === 'Jurídica';

const tabs: TabDef[] = [
  { label: 'Dados Básicos', fields: [
    { key: 'foto', label: 'Foto do Proprietário', type: 'photo', full: true },
    { key: 'nome', label: 'Nome', required: true, full: true },
    { key: 'telefone', label: 'Telefone', mask: maskPhone, placeholder: '(00) 00000-0000', required: true },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'tipo', label: 'Tipo de Pessoa', type: 'select', options: TIPOS_PESSOA, required: true,
      onChange: (v, f) => (v === 'Jurídica' ? { ...f, cpfCnpj: null } : { ...f, cnpj: null, razaoSocial: null }) },
    { key: 'rg', label: 'RG', mask: maskRg, disabled: f => juridica(f) },
    { key: 'cnpj', label: 'CNPJ', mask: maskCnpj, placeholder: '00.000.000/0000-00', disabled: f => !juridica(f), required: juridica },
    { key: 'razaoSocial', label: 'Razão Social', disabled: f => !juridica(f), required: juridica },
  ] },
  { label: 'Dados Pessoais', fields: [
    { key: 'cpfCnpj', label: 'CPF', mask: maskCpf, placeholder: '000.000.000-00', disabled: f => juridica(f), required: f => !juridica(f) },
    { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date' },
    { key: 'sexo', label: 'Sexo', type: 'select', options: SEXOS },
    { key: 'estadoCivil', label: 'Estado Civil', type: 'select', options: ESTADOS_CIVIS },
    { key: 'profissao', label: 'Profissão' },
  ] },
  { label: 'Endereço', fields: addressFields() },
  { label: 'Dados Bancários', fields: [
    { key: 'banco', label: 'Banco' },
    { key: 'agencia', label: 'Agência' },
    { key: 'conta', label: 'Número da Conta' },
    { key: 'tipoConta', label: 'Tipo de Conta', type: 'select', options: TIPOS_CONTA },
    { key: 'chavePix', label: 'Chave PIX' },
    { key: 'titularConta', label: 'Titular da Conta' },
  ] },
];

// Imóveis e negociações vinculados (somente leitura)
function ProprietarioVinculos({ proprietarioId }: { proprietarioId: number }) {
  const navigate = useNavigate();
  const imoveis = useList('imoveis', { proprietarioId });
  const negociacoes = useList('negociacoes');
  const ids = imoveis.rows.map(i => i.id);
  const minhasNegociacoes = negociacoes.rows.filter(n => ids.includes(n.imovelId) || Number(n.proprietarioId) === Number(proprietarioId));
  const situacao = (imovelId: number) =>
    minhasNegociacoes.some(n => n.imovelId === imovelId && n.status === 'Realizada') ? 'Negociado' : 'Disponível';

  return (
    <>
      <RelatedGrid title="Imóveis">
        <DataTable
          compact
          rows={imoveis.rows} loading={imoveis.loading} empty="Nenhum imóvel vinculado."
          columns={[
            { key: 'id', label: 'ID', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'tipo', label: 'Tipo do Imóvel' },
            { key: 'endereco', label: 'Endereço', render: r => fullAddress(r) },
            { key: 'participacao', label: 'Participação (%)', render: () => '100%' },
            { key: 'situacao', label: 'Situação', render: r => <Badge className={situacao(r.id) === 'Disponível' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}>{situacao(r.id)}</Badge> },
          ]}
          actions={r => <button type="button" onClick={() => navigate(`/imoveis/${r.id}`)} className="inline-flex items-center gap-1 text-sky-600 font-semibold text-xs hover:underline"><Eye size={14} /> Visualizar</button>}
        />
      </RelatedGrid>
      <RelatedGrid title="Negociações">
        <DataTable
          compact
          rows={minhasNegociacoes} loading={negociacoes.loading} empty="Nenhuma negociação registrada."
          columns={[
            { key: 'id', label: 'ID da Proposta', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'data', label: 'Data', render: r => formatDate(r.data) },
            { key: 'valor', label: 'Valor', render: r => formatCurrency(r.valor) },
            { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={r => <button type="button" onClick={() => navigate(`/negociacoes/${r.id}`)} className="inline-flex items-center gap-1 text-sky-600 font-semibold text-xs hover:underline"><Eye size={14} /> Visualizar</button>}
        />
      </RelatedGrid>
    </>
  );
}

// Cadastrar / Visualizar / Editar Proprietário
export function ProprietarioPage({ mode }: { mode: Mode }) {
  return (
    <EntityPage
      mode={mode} entity="proprietarios" basePath="/proprietarios" singular="Proprietário" tabs={tabs}
      defaults={{ tipo: 'Física' }}
      validate={f => {
        if (juridica(f) && onlyDigits(f.cnpj).length !== 14) return 'CNPJ inválido: informe os 14 dígitos.';
        if (!juridica(f) && onlyDigits(f.cpfCnpj).length !== 11) return 'CPF inválido: informe os 11 dígitos.';
        if (onlyDigits(f.telefone).length < 10) return 'Telefone inválido: informe DDD + número.';
        return null;
      }}
      extraTabs={[{ label: 'Imóveis e Negociações', render: f => <ProprietarioVinculos proprietarioId={f.id} /> }]}
    />
  );
}
