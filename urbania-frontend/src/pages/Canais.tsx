import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Badge, Card, DataTable, PageHeader, RowActions, Toolbar } from '../components/DataTable';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage } from '../components/EntityPage';
import { useFieldSearch } from '../components/FieldSearch';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { TIPOS_CANAL } from '../lib/options';

const tipoColor = (tipo: string) =>
  tipo === 'Site' ? 'bg-sky-100 text-sky-700' : tipo === 'Impresso' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700';

// Consultar Canal de Publicação
export function CanaisList() {
  const navigate = useNavigate();
  const { rows, loading, reload } = useList('canais');
  const del = useDelete('canais', 'Canal de publicação', reload);
  const search = useFieldSearch<any>([
    { value: 'nome', label: 'Nome', get: c => c.nome },
    { value: 'tipoCanal', label: 'Tipo Canal', get: c => c.tipoCanal },
  ]);

  const filtered = rows.filter(search.filter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Canais de Publicação" subtitle={`${rows.length} cadastrados`}
        action={<button onClick={() => navigate('/canais/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c]"><Plus size={18} /> Cadastrar Canal</button>}
      />
      <Card>
        <Toolbar>{search.controls}</Toolbar>
        <DataTable
          rows={filtered} loading={loading}
          onRowClick={r => navigate(`/canais/${r.id}`)}
          columns={[
            { key: 'id', label: 'ID', render: r => `#${r.id}`, className: 'font-mono text-slate-500 w-20' },
            { key: 'nome', label: 'Nome', className: 'font-semibold text-slate-800' },
            { key: 'tipoCanal', label: 'Tipo Canal', render: r => r.tipoCanal && <Badge className={tipoColor(r.tipoCanal)}>{r.tipoCanal}</Badge> },
            { key: 'observacoes', label: 'Observações', render: r => <span className="text-slate-500 line-clamp-1">{r.observacoes || '-'}</span> },
          ]}
          actions={r => (
            <RowActions onView={() => navigate(`/canais/${r.id}`)} onEdit={() => navigate(`/canais/${r.id}/editar`)} onDelete={() => del.ask(r.id, r.nome)} />
          )}
        />
      </Card>
      {del.modal}
    </div>
  );
}

const tabs: TabDef[] = [{
  label: 'Dados do Canal',
  fields: [
    { key: 'nome', label: 'Nome', required: true, placeholder: 'Ex.: Portal ZAP Imóveis' },
    { key: 'tipoCanal', label: 'Tipo Canal', type: 'select', options: TIPOS_CANAL, required: true },
    { key: 'observacoes', label: 'Observações', type: 'textarea' },
  ],
}];

// Cadastrar / Visualizar / Editar Canal de Publicação
export function CanalPage({ mode }: { mode: Mode }) {
  return <EntityPage mode={mode} entity="canais" basePath="/canais" singular="Canal de Publicação" tabs={tabs} showClear={false} />;
}
