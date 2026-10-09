import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCampoDeBusca } from './DataTable';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function isoToBr(iso: string): string {
  if (!iso) return '';
  const parts = iso.slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return '';
}

function brToIso(br: string): string {
  const clean = br.replace(/\D/g, '');
  if (clean.length !== 8) return '';
  const day = parseInt(clean.slice(0, 2), 10);
  const month = parseInt(clean.slice(2, 4), 10);
  const year = parseInt(clean.slice(4, 8), 10);

  if (year < 1900 || year > 2100) return '';
  if (month < 1 || month > 12) return '';
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return '';

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function maskBrDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export interface DateInputProps {
  value: string; // ISO 'YYYY-MM-DD' ou vazio
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
  id?: string;
  title?: string;
}

export function DateInput({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  className = '',
  minDate,
  maxDate,
  id,
  title,
}: DateInputProps) {
  const { valor, mudar } = useCampoDeBusca(value, onChange);

  const [text, setText] = useState(() => isoToBr(valor));
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  // Sincroniza o texto do campo quando o valor externo/draft muda
  useEffect(() => {
    setText(isoToBr(valor));
  }, [valor]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mês e ano exibidos no mini calendário
  const [viewDate, setViewDate] = useState(() => {
    if (valor) {
      const [y, m] = valor.split('-').map(Number);
      if (y && m) return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  // Atualiza mês de visualização quando abre o calendário
  useEffect(() => {
    if (open) {
      if (valor) {
        const [y, m] = valor.split('-').map(Number);
        if (y && m) setViewDate(new Date(y, m - 1, 1));
      } else {
        setViewDate(new Date());
      }

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setAlignRight(rect.left + 290 > window.innerWidth);
      }
    }
  }, [open, valor]);

  // Fechar ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskBrDate(raw);
    setText(masked);

    const iso = brToIso(masked);
    if (iso) {
      mudar(iso);
    } else if (masked === '') {
      mudar('');
    }
  };

  const handleInputBlur = () => {
    // Se o texto digitado estiver incompleto ou inválido, reverte para o valor válido atual
    const iso = brToIso(text);
    if (!iso) {
      if (text.trim() === '') {
        mudar('');
      } else {
        setText(isoToBr(valor));
      }
    }
  };

  const handleSelectDate = (dateIso: string) => {
    mudar(dateIso);
    setText(isoToBr(dateIso));
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    mudar('');
    setText('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleToday = () => {
    const hoje = new Date();
    const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    handleSelectDate(iso);
  };

  // Cálculo da grade de dias do mini calendário
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const calendarDays = [];

  // Dias do mês anterior
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevM = currentMonth === 0 ? 12 : currentMonth;
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    const iso = `${prevY}-${String(prevM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, isCurrentMonth: false, iso });
  }

  // Dias do mês atual
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, isCurrentMonth: true, iso });
  }

  // Dias do próximo mês para fechar semanas completas (múltiplo de 7)
  const remainingDays = 7 - (calendarDays.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const iso = `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarDays.push({ day, isCurrentMonth: false, iso });
    }
  }

  const ativo = Boolean(valor);

  // Lista de anos para troca rápida (+- 6 anos)
  const baseYear = new Date().getFullYear();
  const anosDisponiveis = Array.from({ length: 15 }, (_, i) => baseYear - 7 + i);

  return (
    <div ref={containerRef} className={`relative inline-block w-full sm:w-auto ${className}`}>
      <div
        className={`h-11 flex items-center border rounded-xl bg-white transition shadow-xs focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/10 ${
          ativo
            ? 'border-[#0a2540]/30 bg-[#0a2540]/5 text-[#0a2540]'
            : 'border-slate-200 text-slate-700'
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          title={title || placeholder}
          placeholder={placeholder}
          value={text}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className={`h-full w-full sm:w-32 pl-3.5 pr-1 bg-transparent text-sm outline-none placeholder:text-slate-400 font-medium ${
            ativo ? 'text-[#0a2540]' : 'text-slate-700'
          }`}
        />

        {ativo && (
          <button
            type="button"
            onClick={handleClear}
            title="Limpar data"
            className="p-1 mr-0.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen(!open)}
          title="Abrir calendário"
          className="h-full px-2.5 flex items-center justify-center text-slate-400 hover:text-[#0a2540] hover:bg-slate-50/80 rounded-r-xl transition cursor-pointer"
          aria-expanded={open}
        >
          <Calendar size={17} className={ativo ? 'text-[#0a2540]' : 'text-slate-400'} />
        </button>
      </div>

      {/* Mini Calendário Dropdown */}
      {open && (
        <div
          className={`absolute top-full mt-1.5 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 select-none ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {/* Cabeçalho do mês e controles */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft size={17} />
            </button>

            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <select
                value={currentMonth}
                onChange={e => setViewDate(new Date(currentYear, Number(e.target.value), 1))}
                className="bg-transparent font-bold cursor-pointer outline-none hover:text-sky-600 text-slate-800 py-0.5"
              >
                {MESES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={e => setViewDate(new Date(Number(e.target.value), currentMonth, 1))}
                className="bg-transparent font-bold cursor-pointer outline-none hover:text-sky-600 text-slate-800 py-0.5"
              >
                {anosDisponiveis.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="text-[11px] font-bold text-slate-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Grade de dias */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cDay, idx) => {
              const isSelected = cDay.iso === valor;
              const isToday = cDay.iso === todayStr;
              const isOutOfRange = Boolean(
                (minDate && cDay.iso < minDate) ||
                (maxDate && cDay.iso > maxDate)
              );

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isOutOfRange}
                  onClick={() => handleSelectDate(cDay.iso)}
                  className={`h-8 w-8 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-[#0a2540] text-white font-bold shadow-xs hover:bg-[#06182c]'
                      : isToday
                      ? 'border border-sky-400 text-sky-600 hover:bg-sky-50 font-bold'
                      : cDay.isCurrentMonth
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cDay.day}
                </button>
              );
            })}
          </div>

          {/* Rodapé com botões de ação rápida */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-[#0a2540] hover:text-[#06182c] font-bold px-2 py-1 rounded hover:bg-[#0a2540]/10 transition cursor-pointer"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface DateRangeFilterProps {
  dataInicio: string;
  dataFim: string;
  onChangeInicio: (val: string) => void;
  onChangeFim: (val: string) => void;
  labelInicio?: string;
  labelFim?: string;
  className?: string;
}

export function DateRangeFilter({
  dataInicio,
  dataFim,
  onChangeInicio,
  onChangeFim,
  labelInicio = 'Data inicial',
  labelFim = 'Data final',
  className = '',
}: DateRangeFilterProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 w-full sm:w-auto ${className}`}>
      <DateInput
        value={dataInicio}
        onChange={onChangeInicio}
        placeholder={labelInicio}
        maxDate={dataFim || undefined}
        title={labelInicio}
      />
      <span className="text-xs text-slate-400 font-medium select-none px-0.5">até</span>
      <DateInput
        value={dataFim}
        onChange={onChangeFim}
        placeholder={labelFim}
        minDate={dataInicio || undefined}
        title={labelFim}
      />
    </div>
  );
}
