import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Eye, Search, Trash2 } from 'lucide-react';
import { usePodeNaRota } from '../lib/auth';

export type Column<T> = { key: string; label: string; render?: (row: T) => ReactNode; className?: string };

// Grid de listagem com altura estruturada e paginação permanente (RNF 1.6 das consultas)
export function DataTable<T extends { id: number }>({ columns, rows, loading, onRowClick, empty, pageSize = 10, compact = false, actions }: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  pageSize?: number;
  compact?: boolean;
  actions?: (row: T) => ReactNode;
}) {
  const [page, setPage] = useState(1);

  // Volta para a primeira página quando um filtro muda a quantidade de linhas
  useEffect(() => setPage(1), [rows.length]);

  const current = rows.slice((page - 1) * pageSize, page * pageSize);
  const colSpan = columns.length + (actions ? 1 : 0);

  return (
    <div className={`flex flex-col justify-between ${compact ? 'min-h-0' : 'min-h-[560px] lg:min-h-[calc(100vh-250px)]'}`}>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              {columns.map(c => <th key={c.key} className="px-6 py-4 whitespace-nowrap">{c.label}</th>)}
              {actions && <th className="px-6 py-4 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={colSpan} className="p-12 text-center text-slate-400">Carregando...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={colSpan} className="p-12 text-center text-slate-400">{empty || 'Nenhum registro encontrado.'}</td></tr>
            ) : current.map(row => (
              <tr key={row.id} onClick={() => onRowClick?.(row)} className={`hover:bg-slate-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map(c => (
                  <td key={c.key} className={`px-6 py-3.5 ${c.className || 'text-slate-700'}`}>
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>{actions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager page={page} setPage={setPage} total={rows.length} pageSize={pageSize} />
    </div>
  );
}

// Paginação com contagem e controles de navegação sempre presentes
export function Pager({ page, setPage, total, pageSize }: { page: number; setPage: (p: number) => void; total: number; pageSize: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap justify-between items-center text-sm text-slate-500 bg-white select-none">
      <span>
        {total === 0 ? 'Nenhum registro encontrado' : `Mostrando ${start}–${end} de ${total}`}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition"
          title="Página anterior"
        >
          <ChevronLeft size={20} />
        </button>

        {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setPage(n)}
            className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition ${
              n === page ? 'bg-[#0a2540] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition"
          title="Próxima página"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// Cores dos botões de ação: só o ícone colorido; escurece e cresce um pouco ao passar o mouse
const ACTION_TONES = {
  view: 'text-sky-700 hover:text-sky-900',
  edit: 'text-amber-600 hover:text-amber-800',
  delete: 'text-red-600 hover:text-red-800',
};

export function ActionButton({ tone, title, onClick, children }: { tone: keyof typeof ACTION_TONES; title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button" title={title} aria-label={title}
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-115 active:scale-95 ${ACTION_TONES[tone]}`}
    >
      {children}
    </button>
  );
}

// Botões Visualizar / Editar / Excluir de cada linha (padrão de ações da listagem)
export function RowActions({
  onView,
  onEdit,
  onDelete,
  viewTitle = 'Visualizar',
  editTitle = 'Editar',
  deleteTitle = 'Excluir',
  children,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  children?: ReactNode;
}) {
  // Editar/Excluir só aparecem se o perfil tiver a permissão no módulo da página
  const pode = usePodeNaRota();
  if (!pode('Editar')) onEdit = undefined;
  if (!pode('Excluir')) onDelete = undefined;
  return (
    <div className="inline-flex items-center gap-1.5">
      {onView && <ActionButton tone="view" title={viewTitle} onClick={onView}><Eye size={16} /></ActionButton>}
      {onEdit && <ActionButton tone="edit" title={editTitle} onClick={onEdit}><Edit2 size={15} /></ActionButton>}
      {onDelete && <ActionButton tone="delete" title={deleteTitle} onClick={onDelete}><Trash2 size={15} /></ActionButton>}
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full md:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540]"
        placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; placeholder: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 bg-white outline-none">
      <option value="">{placeholder}</option>
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row flex-wrap gap-3 md:items-center bg-slate-50/50">{children}</div>;
}

export function Card({ children, title, className = '' }: { children: ReactNode; title?: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm ${className}`}>
      {title && <div className="px-5 py-3 border-b border-slate-100 font-bold text-slate-800">{title}</div>}
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${className}`}>{children}</span>;
}

// Busca "inteligente": ignora acentos e maiúsculas
export const normalize = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const matches = (term: string, ...values: unknown[]) => !term || values.some(v => normalize(v).includes(normalize(term)));
