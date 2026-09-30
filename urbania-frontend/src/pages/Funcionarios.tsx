import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarCheck, CalendarClock, Plus } from 'lucide-react';
import { api } from '../api';
import { Card, DataTable, FilterSelect, PageHeader, SearchInput, Toolbar, matches } from '../components/DataTable';
import { Avatar } from '../components/EntityForm';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage } from '../components/EntityPage';
import { apiError, useToast } from '../components/Toast';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { maskCpf, maskPhone, maskRg, onlyDigits } from '../lib/masks';
import { CARGOS, STATUS_FUNCIONARIO, addressFields } from '../lib/options';
import { RowMenu, StatusDropdown } from './Visitas';

// Consultar Funcionários
export function FuncionariosList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { rows, setRows, loading, reload } = useList('funcionarios');
  const [campo, setCampo] = useState('nome');
  const [term, setTerm] = useState('');
  const del = useDelete('funcionarios', 'Funcionário', reload);

  const filtered = rows.filter(f => (campo === 'cpf' ? matches(onlyDigits(term), onlyDigits(f.cpf)) : matches(term, f.nome)));

  const setStatus = async (id: number, status: string) => {
    try {
      await api.put(`/funcionarios/${id}`, { status });
      setRows(rs => rs.map(r => (r.id === id ? { ...r, status } : r)));
      toast.success(`Funcionário ${status === 'Ativo' ? 'ativado' : 'inativado'}.`);
    } catch (err) {
      toast.error(apiError(err, 'Erro ao alterar o status.'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Funcionários" subtitle={`${rows.length} cadastrados`}
        action={<button onClick={() => navigate('/funcionarios/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c]"><Plus size={18} /> Novo Funcionário</button>}
      />
      <Card>
        <Toolbar>
          <FilterSelect value={campo} onChange={v => setCampo(v || 'nome')} placeholder="Pesquisar por..." options={[{ value: 'nome', label: 'Nome' }, { value: 'cpf', label: 'CPF' }]} />
          <SearchInput value={term} onChange={setTerm} placeholder={campo === 'cpf' ? 'Digite o CPF...' : 'Digite o nome...'} />
        </Toolbar>
        <DataTable
          rows={filtered} loading={loading}
          onRowClick={r => navigate(`/funcionarios/${r.id}`)}
          columns={[
            { key: 'nome', label: 'Nome', render: r => (
              <div className="flex items-center gap-3"><Avatar src={r.foto} name={r.nome} size="sm" /><span className="font-semibold text-slate-800">{r.nome}</span></div>
            ) },
            { key: 'cargo', label: 'Função' },
            { key: 'telefone', label: 'Telefone' },
            { key: 'status', label: 'Status', render: r => <StatusDropdown value={r.status || 'Ativo'} options={STATUS_FUNCIONARIO} onChange={s => setStatus(r.id, s)} /> },
          ]}
          actions={r => (
            <RowMenu items={[
              { label: 'Visualizar', onClick: () => navigate(`/funcionarios/${r.id}`) },
              { label: 'Editar', onClick: () => navigate(`/funcionarios/${r.id}/editar`) },
              { label: 'Excluir', danger: true, onClick: () => del.ask(r.id, r.nome) },
            ]} />
          )}
        />
      </Card>
      {del.modal}
    </div>
  );
}

// Estatísticas exibidas na visualização do funcionário
function Estatisticas({ funcionarioId }: { funcionarioId: number }) {
  const imoveis = useList('imoveis', { responsavelId: funcionarioId });
  const visitas = useList('visitas', { corretorId: funcionarioId });
  const stats = [
    { label: 'Imóveis captados', value: imoveis.rows.length, icon: <Building2 size={20} /> },
    { label: 'Visitas realizadas', value: visitas.rows.filter(v => v.status === 'Realizada').length, icon: <CalendarCheck size={20} /> },
    { label: 'Visitas agendadas', value: visitas.rows.filter(v => v.status === 'Pendente' || v.status === 'Confirmada').length, icon: <CalendarClock size={20} /> },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">{s.icon}</div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{imoveis.loading || visitas.loading ? '…' : s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const corretor = (f: Record<string, any>) => f.cargo === 'Corretor';

const tabs: TabDef[] = [
  { label: 'Dados Pessoais', fields: [
    { key: 'foto', label: 'Foto de Perfil', type: 'photo', full: true },
    { key: 'nome', label: 'Nome Completo', required: true, full: true },
    { key: 'cpf', label: 'CPF', mask: maskCpf, placeholder: '000.000.000-00', required: true, disabled: (_, m) => m === 'edit' },
    { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date', required: true },
    { key: 'rg', label: 'RG', mask: maskRg },
    { key: 'orgaoEmissor', label: 'Órgão Emissor', placeholder: 'Ex.: SSP/RO' },
  ] },
  { label: 'Contato e Função', fields: [
    { key: 'telefone', label: 'Celular', mask: maskPhone, placeholder: '(00) 00000-0000', required: true },
    { key: 'telefoneFixo', label: 'Telefone Fixo', mask: maskPhone, placeholder: '(00) 0000-0000' },
    { key: 'email', label: 'E-mail', type: 'email', required: true },
    { key: 'cargo', label: 'Função (Cargo)', type: 'select', options: CARGOS, required: true },
    { key: 'creci', label: 'CRECI', required: corretor, placeholder: 'Obrigatório para corretores' },
    { key: 'status', label: 'Status', type: 'toggle', options: STATUS_FUNCIONARIO, hidden: f => !f.id },
    { key: 'observacoes', label: 'Observações', type: 'textarea' },
  ] },
  { label: 'Endereço', fields: addressFields(true) },
];

// Cadastrar / Visualizar / Editar Funcionário
export function FuncionarioPage({ mode }: { mode: Mode }) {
  const viewTabs: TabDef[] = mode === 'view'
    ? [{ ...tabs[0], render: f => <div className="mt-6"><h3 className="font-bold text-slate-700 mb-3">Estatísticas</h3><Estatisticas funcionarioId={f.id} /></div> }, ...tabs.slice(1)]
    : tabs;

  return (
    <EntityPage
      mode={mode} entity="funcionarios" basePath="/funcionarios" singular="Funcionário" tabs={viewTabs}
      defaults={{ status: 'Ativo' }} editLabel="Editar perfil"
      validate={f => {
        if (onlyDigits(f.cpf).length !== 11) return 'CPF inválido: informe os 11 dígitos.';
        if (onlyDigits(f.telefone).length < 10) return 'Celular inválido: informe DDD + número.';
        return null;
      }}
    />
  );
}
