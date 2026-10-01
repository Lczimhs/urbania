import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { matches } from './DataTable';

export type Option = { value: string | number; label: string; hint?: string };

// ComboBox que permite pesquisar entre os registros (ex.: proprietário do imóvel)
export function SearchSelect({ value, onChange, options, placeholder = 'Selecione...', disabled, invalid }: {
  value: unknown; onChange: (v: string | number | null) => void; options: Option[]; placeholder?: string; disabled?: boolean; invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => String(o.value) === String(value ?? ''));

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = options.filter(o => matches(term, o.label, o.hint, o.value));

  return (
    <div ref={ref} className="relative">
      <button
        type="button" disabled={disabled} onClick={() => { setOpen(!open); setTerm(''); }}
        aria-invalid={invalid}
        className={`w-full px-3 py-2 border ${invalid ? 'border-red-500' : 'border-slate-300'} rounded-lg bg-white text-left flex justify-between items-center outline-none focus:ring-2 focus:ring-[#0a2540] disabled:bg-slate-100 disabled:text-slate-500`}
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg">
          <div className="p-2 border-b relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={term} onChange={e => setTerm(e.target.value)} placeholder="Pesquisar..." className="w-full pl-7 pr-2 py-1.5 text-sm border rounded outline-none" />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1 text-sm">
            <li><button type="button" onClick={() => { onChange(null); setOpen(false); }} className="w-full text-left px-3 py-2 text-slate-400 hover:bg-slate-50">{placeholder}</button></li>
            {filtered.map(o => (
              <li key={o.value}>
                <button type="button" onClick={() => { onChange(o.value); setOpen(false); }} className={`w-full text-left px-3 py-2 hover:bg-sky-50 ${String(o.value) === String(value) ? 'bg-sky-50 font-semibold' : ''}`}>
                  {o.label}{o.hint && <span className="block text-xs text-slate-400">{o.hint}</span>}
                </button>
              </li>
            ))}
            {!filtered.length && <li className="px-3 py-2 text-slate-400">Nada encontrado.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
