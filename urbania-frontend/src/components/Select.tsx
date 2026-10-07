import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, KeyboardEventHandler, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronUp, Search } from 'lucide-react';

export type Item = { value: string; label: string; hint?: string; disabled?: boolean };
export type SelectProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'children'> & {
  value: unknown;
  onChange: (value: string) => void;
  children?: ReactNode;
  options?: Item[];
  searchable?: boolean;
  portal?: boolean;
  placement?: 'auto' | 'bottom';
  placeholder?: string;
};

function textOf(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child)
    ? textOf(child.props.children) : String(child)).join('');
}

export function Select({
  value,
  onChange,
  children,
  options,
  searchable,
  portal = false,
  placement = 'auto',
  className = '',
  disabled,
  onClick,
  placeholder = 'Selecione...',
  ...props
}: SelectProps) {
  const items: Item[] = options ?? Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean; hint?: string; 'data-hint'?: string }>(child)) return [];
    const label = textOf(child.props.children);
    return [{
      value: String(child.props.value ?? label),
      label,
      hint: child.props.hint || child.props['data-hint'],
      disabled: child.props.disabled,
    }];
  });

  const isCompact = className.includes('system-select-compact') || className.includes('system-status-select');
  const optionsCount = items.filter(item => item.value !== '').length;
  const isSearchable = searchable !== undefined ? searchable : (!isCompact && optionsCount > 5);

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const [openUp, setOpenUp] = useState(false);
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selected = items.find(item => item.value === String(value ?? ''));
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filtered = items.filter(item => {
    if (item.value === '') return false;
    if (!term.trim()) return true;
    const termNorm = normalize(term.trim());
    return normalize(item.label).includes(termNorm) || (item.hint ? normalize(item.hint).includes(termNorm) : false);
  });

  const close = (restoreFocus = false) => {
    setOpen(false);
    setTerm('');
    if (restoreFocus) triggerRef.current?.focus();
  };

  const choose = (item: Item) => {
    if (item.disabled) return;
    onChange(item.value);
    close(true);
  };

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (portal) {
        if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
          close();
        }
      } else {
        if (containerRef.current && !containerRef.current.contains(target)) {
          close();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, portal]);

  // Position calculation for portal mode
  useEffect(() => {
    if (!open || !portal || disabled) return;
    const place = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const height = Math.min(320, placement === 'bottom' ? Math.max(0, below) : Math.max(below, above));
      const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 24);
      setPortalPosition({
        top: placement === 'bottom' || below >= Math.min(320, above) ? rect.bottom + 6 : Math.max(12, rect.top - height - 6),
        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        width,
        maxHeight: height,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, portal, disabled, placement]);

  // Autofocus search input when open
  useEffect(() => {
    if (open && isSearchable) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 15);
      return () => clearTimeout(timer);
    }
  }, [open, isSearchable]);

  // Keep active item visible in scroll container
  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${active}"]`) as HTMLElement | null;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [active, open]);

  const openDropdown = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 260 && rect.top > 260);
    }
    setTerm('');
    const selectedIdx = filtered.findIndex(item => item.value === String(value ?? ''));
    setActive(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
  };

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (disabled) return;
    if (open) {
      close();
    } else {
      openDropdown();
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLElement> = event => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === 'Tab') {
      close();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        openDropdown();
        return;
      }
      if (filtered.length === 0) return;
      setActive(current => {
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        let next = event.key === 'Home' ? 0 : event.key === 'End' ? filtered.length - 1 : current + direction;
        while (next >= 0 && next < filtered.length && filtered[next]?.disabled) next += direction;
        return Math.max(0, Math.min(filtered.length - 1, next));
      });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (open) {
        if (filtered[active]) choose(filtered[active]);
        else if (filtered.length > 0) choose(filtered[0]);
      } else {
        openDropdown();
      }
      return;
    }
    if (event.key === ' ' && !isSearchable) {
      event.preventDefault();
      if (open) {
        if (filtered[active]) choose(filtered[active]);
        else if (filtered.length > 0) choose(filtered[0]);
      } else {
        openDropdown();
      }
      return;
    }
    if (!isSearchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const char = normalize(event.key);
      if (char && filtered.length > 0) {
        const startFrom = (active + 1) % filtered.length;
        let found = -1;
        for (let i = 0; i < filtered.length; i++) {
          const idx = (startFrom + i) % filtered.length;
          const it = filtered[idx];
          if (!it.disabled && normalize(it.label).startsWith(char)) {
            found = idx;
            break;
          }
        }
        if (found >= 0) {
          event.preventDefault();
          setActive(found);
          if (!open) {
            openDropdown();
          }
        }
      }
    }
  };

  const menuContent = (
    <div
      ref={menuRef}
      onKeyDown={handleKeyDown}
      className={`z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden ${
        portal
          ? 'fixed'
          : `absolute left-0 w-full ${openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`
      }`}
      style={portal ? { position: 'fixed', ...portalPosition } : undefined}
      onClick={e => e.stopPropagation()}
    >
      {isSearchable && (
        <div className="p-2 border-b border-slate-100 bg-white relative">
          <Search size={14} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            autoFocus
            type="text"
            value={term}
            onChange={e => {
              setTerm(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar..."
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 outline-none focus:border-[#0a2540] focus:ring-1 focus:ring-[#0a2540] placeholder:text-slate-400 text-[#0a2540] bg-white transition"
          />
        </div>
      )}

      <ul
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        className="max-h-56 overflow-y-auto p-1 text-sm space-y-0.5"
      >
        {/* Opção Selecione... / Limpar */}
        {!term && (
          <li>
            <button
              type="button"
              onClick={() => choose({ value: '', label: placeholder })}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                !value || value === ''
                  ? 'bg-slate-100 text-[#0a2540] font-semibold'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{placeholder}</span>
              {(!value || value === '') && <Check size={16} className="text-[#0a2540] shrink-0" />}
            </button>
          </li>
        )}

        {filtered.map((item, index) => {
          const isSelected = String(item.value) === String(value ?? '');
          return (
            <li key={item.value}>
              <button
                type="button"
                data-index={index}
                disabled={item.disabled}
                onClick={() => choose(item)}
                onMouseEnter={() => setActive(index)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                  item.disabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'bg-[#0a2540]/10 font-semibold text-[#0a2540]'
                    : index === active
                    ? 'bg-slate-100 text-[#0a2540]'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.hint && (
                    <span className="block text-xs font-normal text-slate-500 mt-0.5 truncate">
                      {item.hint}
                    </span>
                  )}
                </div>
                {isSelected && <Check size={16} className="shrink-0 text-[#0a2540]" />}
              </button>
            </li>
          );
        })}

        {filtered.length === 0 && (
          <li className="px-3 py-3 text-sm text-slate-400 text-center">
            Nada encontrado.
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className.includes('inline') ? 'inline-block' : 'w-full'}`}
    >
      <button
        {...props}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-controls={`${id}-list`}
        className={`system-select ${className}`}
        onKeyDown={handleKeyDown}
        onClick={handleToggle}
      >
        <span className={`min-w-0 truncate ${selected && selected.value !== '' ? 'text-[#0a2540] font-medium' : 'text-slate-400'}`}>
          {selected?.label || placeholder}
        </span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-400" />
        )}
      </button>

      {open && !disabled && (portal ? createPortal(menuContent, document.body) : menuContent)}
    </div>
  );
}
