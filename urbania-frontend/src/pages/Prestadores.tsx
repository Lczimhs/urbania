import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Card, DataTable, PageHeader, RowActions, Toolbar } from '../components/DataTable';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage } from '../components/EntityPage';
import { useFieldSearch } from '../components/FieldSearch';
import { SearchSelect } from '../components/SearchSelect';
import { useToast } from '../components/Toast';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { maskCpfCnpj, maskPhone, onlyDigits } from '../lib/masks';
import { TIPOS_CHAVE_PIX, UFS } from '../lib/options';
import { Pode } from '../lib/auth';

// Serviços do prestador ficam salvos como lista JSON de ids (ex.: "[1,3]")
export const parseIds = (v: unknown): number[] => {
  try {
    const parsed = JSON.parse(String(v || '[]'));
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
};

// Consultar Prestador de Serviço
export function PrestadoresList() {
  const navigate = useNavigate();
  const { rows, loading, reload } = useList('prestadores');
  const servicos = useList('servicos');
  const del = useDelete('prestadores', 'Prestador', reload);
  const nomesServicos = (p: any) => parseIds(p.servicos).map(id => servicos.rows.find(s => s.id === id)?.nome).filter(Boolean) as string[];
  const search = useFieldSearch<any>([
    { value: 'nome', label: 'Nome', get: p => `${p.nome} ${p.razaoSocial || ''}` },
    { value: 'servico', label: 'Tipo serviço', get: p => nomesServicos(p).join(' ') },
  ]);

  const filtered = rows.filter(search.filter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Prestadores de Serviço" subtitle={`${rows.length} cadastrados`}
        action={<Pode acao="Criar"><button onClick={() => navigate('/prestadores/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c]"><Plus size={18} /> Cadastrar Prestador</button></Pode>}
      />
      <Card>
        <Toolbar>{search.controls}</Toolbar>
        <DataTable
          rows={filtered} loading={loading || servicos.loading}
          onRowClick={r => navigate(`/prestadores/${r.id}`)}
          columns={[
            { key: 'id', label: 'ID', render: r => `#${r.id}`, className: 'font-mono text-slate-500 w-20' },
            { key: 'nome', label: 'Nome', render: r => (
              <div>
                <p className="font-semibold text-slate-800">{r.nome}</p>
                {r.razaoSocial && <p className="text-xs text-slate-400">{r.razaoSocial}</p>}
              </div>
            ) },
            { key: 'cpfCnpj', label: 'CPF/CNPJ', className: 'text-slate-600' },
            { key: 'telefone', label: 'Telefone', className: 'text-slate-600 font-medium' },
            { key: 'servicos', label: 'Serviços Prestados', render: r => (
              <div className="flex flex-wrap gap-1">
                {nomesServicos(r).map(n => <Badge key={n} className="bg-sky-100 text-sky-700">{n}</Badge>)}
              </div>
            ) },
          ]}
          actions={r => (
            <RowActions onView={() => navigate(`/prestadores/${r.id}`)} onEdit={() => navigate(`/prestadores/${r.id}/editar`)} onDelete={() => del.ask(r.id, r.nome)} />
          )}
        />
      </Card>
      {del.modal}
    </div>
  );
}

// ComboBox "Serviço Prestado" + grid com os serviços adicionados (ID, Nome, Ação)
function ServicosGrid({ ids, servicos, disabled, invalid, onChange }: {
  ids: number[]; servicos: any[]; disabled: boolean; invalid: boolean; onChange: (ids: number[]) => void;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState<string | number | null>(null);
  const disponiveis = servicos.filter(s => !ids.includes(s.id));

  const add = () => {
    if (!selected) return toast.error('Selecione um serviço para adicionar.');
    onChange([...ids, Number(selected)]);
    setSelected(null);
  };

  return (
    <div className="space-y-3">
      {!disabled && (
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchSelect value={selected} onChange={setSelected} invalid={invalid} placeholder="Selecione o serviço prestado..."
              options={disponiveis.map(s => ({ value: s.id, label: s.nome, hint: s.categoria }))} />
          </div>
          <button type="button" onClick={add} className="px-4 py-2 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#06182c] flex items-center gap-1.5 shrink-0">
            <Plus size={16} /> Adicionar
          </button>
        </div>
      )}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-20">ID</th>
              <th className="px-4 py-3">Nome</th>
              {!disabled && <th className="px-4 py-3 text-right">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!ids.length && <tr><td colSpan={3} className="p-6 text-center text-slate-400">Nenhum serviço adicionado.</td></tr>}
            {ids.map(id => {
              const s = servicos.find(x => x.id === id);
              return (
                <tr key={id}>
                  <td className="px-4 py-2.5 font-mono text-slate-500">#{id}</td>
                  <td className="px-4 py-2.5 text-slate-800">{s?.nome || 'Serviço removido'}{s?.categoria && <span className="text-xs text-slate-400"> · {s.categoria}</span>}</td>
                  {!disabled && (
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" onClick={() => onChange(ids.filter(x => x !== id))} className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold hover:underline">
                        <Trash2 size={14} /> Excluir
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Cadastrar / Visualizar / Editar Prestador de Serviço
export function PrestadorPage({ mode }: { mode: Mode }) {
  const servicos = useList('servicos');
  if (servicos.loading) return <p className="text-slate-400 p-8">Carregando...</p>;

  const tabs: TabDef[] = [
    { label: 'Dados Pessoais', fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'razaoSocial', label: 'Razão Social' },
      { key: 'cpfCnpj', label: 'CPF/CNPJ', mask: maskCpfCnpj, placeholder: '000.000.000-00', required: true },
      { key: 'telefone', label: 'Telefone para Contato', mask: maskPhone, placeholder: '(00) 00000-0000', required: true },
      { key: 'email', label: 'E-mail', type: 'email' },
    ] },
    { label: 'Endereço', fields: [
      { key: 'pais', label: 'País' },
      { key: 'uf', label: 'Estado', type: 'select', options: UFS },
      { key: 'cidade', label: 'Cidade' },
      { key: 'bairro', label: 'Bairro' },
      { key: 'logradouro', label: 'Rua' },
      { key: 'numero', label: 'Nº' },
      { key: 'complemento', label: 'Complemento', full: true },
    ] },
    { label: 'Dados Profissionais', fields: [
      { key: 'servicos', label: 'Serviço Prestado', type: 'custom', full: true, required: true,
        render: (value, set, { disabled, invalid }) => (
          <ServicosGrid ids={parseIds(value)} servicos={servicos.rows} disabled={disabled} invalid={invalid}
            onChange={ids => set(ids.length ? JSON.stringify(ids) : null)} />
        ) },
      { key: 'banco', label: 'Banco' },
      { key: 'agencia', label: 'Agência' },
      { key: 'conta', label: 'Número da Conta' },
      { key: 'tipoChavePix', label: 'Tipo de Chave Pix', type: 'select', options: TIPOS_CHAVE_PIX },
      { key: 'chavePix', label: 'Chave Pix', required: f => !!f.tipoChavePix },
    ] },
  ];

  return (
    <EntityPage
      mode={mode} entity="prestadores" basePath="/prestadores" singular="Prestador" tabs={tabs}
      defaults={{ pais: 'Brasil' }} showClear={false}
      validate={f => {
        const doc = onlyDigits(f.cpfCnpj).length;
        if (doc !== 11 && doc !== 14) return 'CPF/CNPJ inválido: informe 11 dígitos (CPF) ou 14 dígitos (CNPJ).';
        if (onlyDigits(f.telefone).length < 10) return 'Telefone inválido: informe DDD + número.';
        return null;
      }}
      // "especialidade" é a coluna antiga; mantida preenchida com os nomes dos serviços
      prepare={f => ({
        ...f,
        especialidade: parseIds(f.servicos).map(id => servicos.rows.find(s => s.id === id)?.nome).filter(Boolean).join(', '),
      })}
    />
  );
}
