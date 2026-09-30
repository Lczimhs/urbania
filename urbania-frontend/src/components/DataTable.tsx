import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Eye, Search, Trash2 } from 'lucide-react';

export type Column<T> = { key: string; label: string; render?: (row: T) => ReactNode; className?: string };

// Grid de listagem com paginação automática a partir de 10 registros (RNF 1.6 das consultas)
export function DataTable<T extends { id: number }>({ columns, rows, loading, onRowClick, empty, pageSize = 10, actions }: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  pageSize?: number;
  actions?: (row: T) => ReactNode;
}) {
  const [page, setPage] = useState(1);

  // Volta para a primeira página quando um filtro muda a quantidade de linhas
  useEffect(() => setPage(1), [rows.length]);

  const current = rows.slice((page - 1) * pageSize, page * pageSize);
  const colSpan = columns.length + (actions ? 1 : 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              {columns.map(c => <th key={c.key} className="px-5 py-3 whitespace-nowrap">{c.label}</th>)}
              {actions && <th className="px-5 py-3 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={colSpan} className="p-8 text-center text-slate-400">Carregando...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={colSpan} className="p-8 text-center text-slate-400">{empty || 'Nenhum registro encontrado.'}</td></tr>
            ) : current.map(row => (
              <tr key={row.id} onClick={() => onRowClick?.(row)} className={`hover:bg-slate-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map(c => (
                  <td key={c.key} className={`px-5 py-3.5 ${c.className || 'text-slate-700'}`}>
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>{actions(row)}</td>
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

// Paginação exibida quando há mais registros que o tamanho da página
export function Pager({ page, setPage, total, pageSize }: { page: number; setPage: (p: number) => void; total: number; pageSize: number }) {
  if (total <= pageSize) return null;
  const pages = Math.ceil(total / pageSize);
  return (
    <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
      <span>Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} de {total}</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 disabled:opacity-30 hover:text-slate-800"><ChevronLeft size={20} /></button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => setPage(n)} className={`w-7 h-7 rounded font-bold ${n === page ? 'bg-[#0a2540] text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{n}</button>
        ))}
        <button disabled={page === pages} onClick={() => setPage(page + 1)} className="p-1 disabled:opacity-30 hover:text-slate-800"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}

// Botões Visualizar / Editar / Excluir de cada linha
export function RowActions({ onView, onEdit, onDelete }: { onView?: () => void; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="inline-flex items-center gap-1 text-slate-400">
      {onView && <button title="Visualizar" onClick={onView} className="p-1.5 rounded hover:bg-sky-50 hover:text-sky-600"><Eye size={16} /></button>}
      {onEdit && <button title="Editar" onClick={onEdit} className="p-1.5 rounded hover:bg-amber-50 hover:text-amber-600"><Edit2 size={16} /></button>}
      {onDelete && <button title="Excluir" onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>}
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
