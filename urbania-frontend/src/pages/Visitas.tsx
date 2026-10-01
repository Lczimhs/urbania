import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarX2, MapPin, MoreVertical, Plus } from 'lucide-react';
import { api } from '../api';
import { Card, DataTable, PageHeader, RowActions, SearchInput, Toolbar, matches } from '../components/DataTable';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage } from '../components/EntityPage';
import { ConfirmModal } from '../components/Modal';
import { apiError, useToast } from '../components/Toast';
import { useList } from '../lib/useApi';
import { formatDate, fullAddress, todayISO } from '../lib/format';
import { STATUS_VISITA, statusColor } from '../lib/options';

const QUICK_FILTERS = ['Todas', 'Hoje', 'Esta Semana', 'Pendentes'] as const;
type QuickFilter = typeof QUICK_FILTERS[number];

const weekRange = () => {
  const d = new Date();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  return [iso(monday), iso(sunday)];
};

// Menu de três pontos com atalhos da linha
export function RowMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean; hidden?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div ref={ref} className="relative inline-block text-left">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><MoreVertical size={18} /></button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 bg-white border rounded-lg shadow-lg py-1">
          {items.filter(i => !i.hidden).map(i => (
            <button key={i.label} onClick={() => { setOpen(false); i.onClick(); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${i.danger ? 'text-red-600' : 'text-slate-700'}`}>{i.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Status editável direto na tabela
export function StatusDropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} onClick={e => e.stopPropagation()}
      className={`text-xs font-bold rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer ${statusColor(value)}`}>
      {options.map(o => <option key={o} value={o} className="bg-white text-slate-700">{o}</option>)}
    </select>
  );
}

// Consultar Visitas
export function VisitasList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { rows, setRows, loading } = useList('visitas');
  const clientes = useList('clientes');
  const imoveis = useList('imoveis');
  const [quick, setQuick] = useState<QuickFilter>('Todas');
  const [term, setTerm] = useState('');
  const [cancelar, setCancelar] = useState<number | null>(null);

  const cliente = (id: number) => clientes.rows.find(c => c.id === id);
  const imovel = (id: number) => imoveis.rows.find(i => i.id === id);
  const [inicioSemana, fimSemana] = weekRange();

  const filtered = rows
    .filter(v => {
      if (quick === 'Hoje') return v.data === todayISO();
      if (quick === 'Esta Semana') return v.data >= inicioSemana && v.data <= fimSemana;
      if (quick === 'Pendentes') return v.status === 'Pendente';
      return true;
    })
    .filter(v => matches(term, cliente(v.clienteId)?.nome, imovel(v.imovelId)?.titulo, v.imovelId, v.status))
    .sort((a, b) => `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`));

  const setStatus = async (id: number, status: string) => {
    try {
      await api.put(`/visitas/${id}`, { status });
      setRows(rs => rs.map(r => (r.id === id ? { ...r, status } : r)));
      toast.success(`Status da visita #${id} alterado para ${status}.`);
    } catch (err) {
      toast.error(apiError(err, 'Erro ao alterar o status.'));
    }
  };

  const empty = (
    <div className="py-6 flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center"><CalendarX2 size={32} /></div>
      <p className="font-semibold text-slate-600">Nenhuma visita encontrada para este filtro.</p>
      <button onClick={() => navigate('/visitas/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-4 py-2 rounded-lg font-semibold text-sm"><Plus size={16} /> Agendar nova visita</button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Visitas" subtitle={`${rows.length} registradas`}
        action={<button onClick={() => navigate('/visitas/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c]"><Plus size={18} /> Agendar Visita</button>}
      />
      <Card>
        <Toolbar>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map(q => (
              <button key={q} onClick={() => setQuick(q)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${quick === q ? 'bg-[#0a2540] text-white border-[#0a2540]' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{q}</button>
            ))}
          </div>
          <SearchInput value={term} onChange={setTerm} placeholder="Pesquisar cliente, imóvel ou status..." />
        </Toolbar>
        <DataTable
          rows={filtered} loading={loading} empty={empty}
          onRowClick={r => navigate(`/visitas/${r.id}`)}
          columns={[
            { key: 'data', label: 'Data / Hora', render: r => <span className="font-semibold">{formatDate(r.data)} <span className="text-slate-400 font-normal">{r.hora}</span></span> },
            { key: 'cliente', label: 'Cliente', render: r => cliente(r.clienteId)?.nome || r.clienteNome || `#${r.clienteId}` },
            { key: 'imovel', label: 'Imóvel', render: r => <span><span className="font-mono text-slate-400">#{r.imovelId}</span> {imovel(r.imovelId)?.titulo}</span> },
            { key: 'status', label: 'Status', render: r => <StatusDropdown value={r.status} options={STATUS_VISITA} onChange={s => setStatus(r.id, s)} /> },
          ]}
          actions={r => (
            <RowActions
              onView={() => navigate(`/visitas/${r.id}`)}
              onEdit={() => navigate(`/visitas/${r.id}/editar`)}
              onDelete={() => setCancelar(r.id)}
              deleteTitle={r.status === 'Cancelada' ? 'Cancelar visita' : 'Cancelar visita'}
            />
          )}
        />
      </Card>
      {cancelar !== null && (
        <ConfirmModal
          title="Cancelar visita" message="Deseja realmente cancelar a visita?"
          onConfirm={() => { setStatus(cancelar, 'Cancelada'); setCancelar(null); }} onCancel={() => setCancelar(null)}
        />
      )}
    </div>
  );
}

// Cadastrar / Visualizar / Editar Visita
export function VisitaPage({ mode }: { mode: Mode }) {
  const clientes = useList('clientes');
  const imoveis = useList('imoveis');
  const corretores = useList('funcionarios', { cargo: 'Corretor' });

  if (clientes.loading || imoveis.loading || corretores.loading) return <p className="text-slate-400 p-8">Carregando...</p>;

  const find = (list: any[], id: unknown) => list.find(x => String(x.id) === String(id));

  const tabs: TabDef[] = [{
    label: 'Dados da Visita',
    fields: [
      { key: 'clienteId', label: 'Cliente', type: 'search-select', required: true, disabled: (_, m) => m === 'edit',
        options: clientes.rows.map(c => ({ value: c.id, label: c.nome, hint: c.cpfCnpj })) },
      { key: 'imovelId', label: 'Imóvel', type: 'search-select', required: true, disabled: (_, m) => m === 'edit',
        options: imoveis.rows.map(i => ({ value: i.id, label: `#${i.id} - ${i.titulo}`, hint: [i.bairro, i.cidade].filter(Boolean).join(' - ') })) },
      { key: 'corretorId', label: 'Corretor', type: 'select', required: true,
        options: corretores.rows.map(c => ({ value: c.id, label: c.nome })) },
      { key: 'status', label: 'Status da Visita', type: 'select', options: STATUS_VISITA, hidden: () => mode === 'create' },
      { key: 'data', label: 'Data', type: 'date', required: true },
      { key: 'hora', label: 'Hora', type: 'time', required: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ],
    render: form => {
      const c = find(clientes.rows, form.clienteId);
      const i = find(imoveis.rows, form.imovelId);
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {c && (
            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1 text-slate-500">CPF/CNPJ do Cliente</label>
                <input readOnly disabled value={c.cpfCnpj || '—'} className="w-full px-3 py-2 border rounded-lg bg-slate-100 text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1 text-slate-500">Telefone do Cliente</label>
                <input readOnly disabled value={c.telefone || '—'} className="w-full px-3 py-2 border rounded-lg bg-slate-100 text-slate-600" />
              </div>
            </div>
          )}
          {i && (
            <div className="sm:col-span-2 flex gap-3 p-4 rounded-lg bg-sky-50 border border-sky-100">
              <MapPin className="text-sky-600 shrink-0" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase text-sky-700">Endereço do imóvel</p>
                <p className="text-slate-800 font-medium">{fullAddress(i) || 'Endereço não cadastrado'}</p>
              </div>
            </div>
          )}
        </div>
      );
    },
  }];

  return (
    <EntityPage
      mode={mode} entity="visitas" basePath="/visitas" singular="Visita" tabs={tabs} feminine
      defaults={{ status: 'Pendente' }} showClear={false}
      cancelConfirm={mode === 'edit' ? 'Tem certeza que deseja cancelar? As alterações não serão salvas.' : undefined}
      prepare={f => ({
        ...f,
        status: f.status || 'Pendente',
        clienteNome: find(clientes.rows, f.clienteId)?.nome,
        imovelTitulo: find(imoveis.rows, f.imovelId)?.titulo,
        corretor: find(corretores.rows, f.corretorId)?.nome,
      })}
    />
  );
}
