import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, KeyboardEventHandler, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

type Item = { value: string; label: string; hint?: string; disabled?: boolean };
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'children'> & {
  value: unknown;
  onChange: (value: string) => void;
  children?: ReactNode;
  options?: Item[];
  searchable?: boolean;
  placement?: 'auto' | 'bottom';
};

function textOf(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child)
    ? textOf(child.props.children) : String(child)).join('');
}

// Shared dropdown: its menu is portaled so forms and table overflow cannot clip it.
export function Select({ value, onChange, children, options, searchable = false, placement = 'auto', className = '', disabled, onClick, ...props }: Props) {
  const items: Item[] = options ?? Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return [];
    const label = textOf(child.props.children);
    return [{ value: String(child.props.value ?? label), label, disabled: child.props.disabled }];
  });
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 280 });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  const selected = items.find(item => item.value === String(value ?? ''));
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = items.filter(item => normalize(`${item.label} ${item.hint ?? ''}`).includes(normalize(term)));

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  };
  const choose = (item: Item) => {
    if (item.disabled) return;
    onChange(item.value);
    close(true);
  };

  useEffect(() => {
    if (!open || disabled) return;
    const place = () => {
      const rect = trigger.current!.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const height = Math.min(280, placement === 'bottom' ? Math.max(0, below) : Math.max(below, above));
      const width = Math.min(Math.max(rect.width, 200), window.innerWidth - 24);
      setPosition({ top: placement === 'bottom' || below >= Math.min(280, above) ? rect.bottom + 6 : Math.max(12, rect.top - height - 6), left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), width, maxHeight: height });
    };
    place();
    const outside = (event: Event) => {
      if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    if (searchable) search.current?.focus();
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, disabled, searchable, placement]);

  useEffect(() => {
    if (open) menu.current?.querySelector(`#${CSS.escape(id)}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);

  const keys: KeyboardEventHandler<HTMLElement> = event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === 'Tab') { close(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) setTerm('');
      setOpen(true);
      setActive(current => {
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        let next = event.key === 'Home' ? 0 : event.key === 'End' ? filtered.length - 1 : !open ? Math.max(0, filtered.findIndex(i => i.value === String(value ?? ''))) : current + direction;
        while (next >= 0 && next < filtered.length && filtered[next].disabled) next += direction;
        return Math.max(0, Math.min(filtered.length - 1, next));
      });
    } else if (event.key === 'Enter' || (event.key === ' ' && event.currentTarget.tagName !== 'INPUT')) {
      event.preventDefault();
      if (open && filtered[active]) choose(filtered[active]);
      else { setTerm(''); setActive(Math.max(0, items.findIndex(item => item === selected))); setOpen(true); }
    } else if (!searchable && event.key.length === 1) {
      const index = filtered.findIndex(item => !item.disabled && normalize(item.label).startsWith(normalize(event.key)));
      if (index >= 0) { setActive(index); setOpen(true); }
    }
  };

  return <>
    <button {...props} ref={trigger} type="button" disabled={disabled} role="combobox" aria-haspopup="listbox" aria-expanded={open && !disabled} aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      className={`system-select ${className}`} onKeyDown={keys}
      onClick={event => { onClick?.(event); setTerm(''); setActive(Math.max(0, items.findIndex(i => i === selected))); setOpen(!open); }}>
      <span className="min-w-0 truncate">{selected?.label || 'Selecione...'}</span>
      <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && !disabled && createPortal(
      <div ref={menu} className="system-select-menu" style={{ position: 'fixed', ...position }} onClick={e => e.stopPropagation()}>
        {searchable && <div className="relative border-b border-slate-100 p-2">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-cadastro/50" />
          <input ref={search} aria-label="Pesquisar opções" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls={`${id}-list`} aria-activedescendant={`${id}-option-${active}`} value={term} onChange={e => { setTerm(e.target.value); setActive(0); }} onKeyDown={keys} placeholder="Pesquisar..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-cadastro outline-none focus:border-cadastro focus:ring-2 focus:ring-cadastro/10" />
        </div>}
        <ul id={`${id}-list`} role="listbox" aria-label={props['aria-label'] || props.title || 'Opções'} className="min-h-0 overflow-y-auto p-1.5">
          {filtered.map((item, index) => <li key={item.value} id={`${id}-option-${index}`} role="option" aria-selected={item === selected} aria-disabled={item.disabled} onMouseEnter={() => setActive(index)} onPointerDown={e => e.preventDefault()} onClick={() => choose(item)}
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${item.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} ${item === selected ? 'bg-cadastro/10 font-semibold text-cadastro' : index === active ? 'bg-slate-100 text-cadastro' : 'text-cadastro'}`}>
            <span>{item.label}{item.hint && <span className="block text-xs font-normal text-slate-500">{item.hint}</span>}</span>
            {item === selected && <Check size={16} className="shrink-0" />}
          </li>)}
          {!filtered.length && <li className="px-3 py-4 text-sm text-slate-500">Nada encontrado.</li>}
        </ul>
      </div>, document.body)}
  </>;
}
