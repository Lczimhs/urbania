import { useState } from 'react';
import type { ReactNode } from 'react';
import { Table2, BarChart3 } from 'lucide-react';

// Gráficos simples em HTML (responsivos, com tooltip ao passar o mouse e alternativa em tabela).
// Cores validadas para daltonismo e contraste sobre fundo branco.
export const SERIES_COLORS = ['#2a78d6', '#eb6834'];

function ChartCard({ title, subtitle, children, table }: { title: string; subtitle?: string; children: ReactNode; table: ReactNode }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex flex-col">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div>
          <h2 className="font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={() => setAsTable(!asTable)} title={asTable ? 'Ver gráfico' : 'Ver como tabela'} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
          {asTable ? <BarChart3 size={16} /> : <Table2 size={16} />}
        </button>
      </div>
      <div className="flex-1">{asTable ? table : children}</div>
    </div>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-xs text-slate-500 uppercase">{head.map((h, i) => <th key={h} className={`py-1.5 ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`py-1.5 ${j ? 'text-right font-medium text-slate-800' : 'text-slate-600'}`}>{c}</td>)}</tr>)}
      </tbody>
    </table>
  );
}

// align: onde ancorar a dica para ela não sair do cartão nas pontas do gráfico
const Tooltip = ({ children, align = 'center' }: { children: ReactNode; align?: 'left' | 'center' | 'right' }) => (
  <div className={`absolute z-20 bottom-full mb-2 ${align === 'center' ? 'left-1/2 -translate-x-1/2' : align === 'left' ? 'left-0' : 'right-0'}`}>
    <div className=" px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg whitespace-nowrap pointer-events-none">{children}</div>
  </div>
);

// Arredonda o topo da escala para um valor "redondo" (ex.: 30.420 -> 40.000)
const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map(m => m * mag).find(n => n >= v)!;
};

// Barras horizontais: quantidade por categoria (uma única cor; o rótulo identifica cada barra)
export function BarList({ title, subtitle, items, format = String, unit = '' }: {
  title: string; subtitle?: string; items: { label: string; value: number }[]; format?: (v: number) => string; unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...items.map(i => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <ChartCard title={title} subtitle={subtitle} table={<SimpleTable head={['Categoria', 'Total']} rows={items.map(i => [i.label, format(i.value)])} />}>
      {!items.length ? <p className="text-sm text-slate-400 py-8 text-center">Sem dados ainda.</p> : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={it.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="relative">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{it.label}</span>
                <span className="font-semibold text-slate-800">{format(it.value)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${(it.value / max) * 100}%`, background: SERIES_COLORS[0], opacity: hover === null || hover === i ? 1 : 0.45 }} />
              </div>
              {hover === i && (
                <Tooltip><strong>{it.label}</strong>: {format(it.value)}{unit} · {total ? Math.round((it.value / total) * 100) : 0}% do total</Tooltip>
              )}
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

// Colunas agrupadas por período (ex.: receitas x despesas por mês) — um único eixo de valores
export function GroupedColumns({ title, subtitle, groups, series, format }: {
  title: string; subtitle?: string;
  groups: { label: string; fullLabel?: string; values: number[] }[];
  series: string[];
  format: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...groups.flatMap(g => g.values)));
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <ChartCard title={title} subtitle={subtitle}
      table={<SimpleTable head={['Período', ...series]} rows={groups.map(g => [g.label, ...g.values.map(format)])} />}>
      <div className="flex gap-4 mb-3">
        {series.map((s, i) => (
          <span key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SERIES_COLORS[i] }} />{s}
          </span>
        ))}
      </div>
      <div className="relative h-56 flex">
        {/* Eixo e grade */}
        <div className="w-16 shrink-0 relative text-[10px] text-slate-400">
          {ticks.map(t => <span key={t} className="absolute right-2 -translate-y-1/2" style={{ top: `${(1 - t) * 100}%` }}>{format(max * t).replace(/,00$/, '')}</span>)}
        </div>
        <div className="flex-1 relative">
          {ticks.map(t => <div key={t} className="absolute inset-x-0 border-t border-slate-100" style={{ top: `${(1 - t) * 100}%` }} />)}
          <div className="absolute inset-0 flex items-end justify-around gap-1">
            {groups.map((g, gi) => (
              <div key={g.label} className="relative h-full flex-1 flex items-end justify-center gap-[2px] cursor-default"
                onMouseEnter={() => setHover(gi)} onMouseLeave={() => setHover(null)}>
                {hover === gi && <div className="absolute inset-0 bg-slate-100/70 rounded-md" />}
                {g.values.map((v, si) => (
                  <div key={si} className="relative w-full max-w-[22px] rounded-t-[4px] transition-all"
                    style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0, background: SERIES_COLORS[si] }} />
                ))}
                {hover === gi && (
                  <Tooltip align={gi === 0 ? 'left' : gi === groups.length - 1 ? 'right' : 'center'}>
                    <p className="font-bold mb-1">{g.fullLabel || g.label}</p>
                    {series.map((s, si) => (
                      <p key={s} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: SERIES_COLORS[si] }} />{s}: {format(g.values[si])}</p>
                    ))}
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex ml-16 justify-around mt-2">
        {groups.map(g => <span key={g.label} className="flex-1 text-center text-xs text-slate-500">{g.label}</span>)}
      </div>
    </ChartCard>
  );
}
