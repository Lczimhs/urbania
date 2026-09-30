import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowLeft, Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { formatCurrency, formatDate, initials, parseCurrencyInput } from '../lib/format';
import { imageToDataUrl, parsePhotos } from '../lib/files';
import { buscarCep } from '../lib/cep';
import { SearchSelect } from './SearchSelect';
import type { Option } from './SearchSelect';
import { ConfirmModal } from './Modal';
import { useToast } from './Toast';

export type Mode = 'create' | 'edit' | 'view';
type Form = Record<string, any>;

export type FieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'time' | 'number' | 'textarea' | 'select' | 'search-select' | 'currency' | 'photo' | 'photos' | 'toggle';
  options?: (string | Option)[];
  mask?: (v: unknown) => string;
  required?: boolean | ((form: Form) => boolean);
  disabled?: boolean | ((form: Form, mode: Mode) => boolean);
  hidden?: (form: Form) => boolean;
  full?: boolean;              // ocupa a linha inteira
  placeholder?: string;
  suffix?: string;             // ex.: "m²"
  cep?: boolean;               // preenche logradouro/bairro/cidade/uf automaticamente
  onChange?: (value: any, form: Form) => Form | void;  // campos extras que mudam junto
};

export type TabDef = { label: string; fields?: FieldDef[]; render?: (form: Form, mode: Mode) => ReactNode };

const toOptions = (opts: (string | Option)[] = []): Option[] => opts.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
const isRequired = (f: FieldDef, form: Form) => (typeof f.required === 'function' ? f.required(form) : !!f.required);
const isDisabled = (f: FieldDef, form: Form, mode: Mode) => (typeof f.disabled === 'function' ? f.disabled(form, mode) : !!f.disabled);
const isEmpty = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

const inputClass = (invalid: boolean) =>
  `w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#0a2540] disabled:bg-slate-100 disabled:text-slate-500 ${invalid ? 'border-red-500 bg-red-50' : 'bg-white'}`;

// Formulário em abas reaproveitado nas telas de Cadastrar, Editar e Visualizar
export function EntityForm({ title, mode, initial, tabs, defaults = {}, onSubmit, onBack, onEdit, validate, showClear = true, cancelConfirm, submitLabel = 'Salvar', editLabel = 'Editar' }: {
  title: string;
  mode: Mode;
  initial: Form;
  tabs: TabDef[];
  defaults?: Form;
  onSubmit?: (form: Form) => Promise<void>;
  onBack: () => void;
  onEdit?: () => void;
  validate?: (form: Form) => string | null;
  showClear?: boolean;
  cancelConfirm?: string;   // mensagem do modal ao cancelar (ex.: edição de visita)
  submitLabel?: string;
  editLabel?: string;
}) {
  const [form, setForm] = useState<Form>(initial);
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const toast = useToast();
  const view = mode === 'view';

  const allFields = tabs.flatMap((t, i) => (t.fields || []).map(f => ({ ...f, tab: i })));

  const set = (f: FieldDef, value: any) => {
    let next = { ...form, [f.key]: value };
    if (f.onChange) next = f.onChange(value, next) || next;
    setForm(next);
    if (errors[f.key]) setErrors({ ...errors, [f.key]: false });

    if (f.cep && String(value).replace(/\D/g, '').length === 8) {
      buscarCep(String(value)).then(addr => {
        if (addr) setForm(cur => ({ ...cur, ...addr }));
        else toast.error('CEP não encontrado. Preencha o endereço manualmente.');
      });
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const missing = allFields.filter(f => !f.hidden?.(form) && isRequired(f, form) && isEmpty(form[f.key]));
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map(f => [f.key, true])));
      setTab(missing[0].tab);
      toast.error('Preencha os campos obrigatórios: ' + missing.map(f => f.label).join(', ') + '.');
      return;
    }
    const custom = validate?.(form);
    if (custom) return toast.error(custom);

    setSaving(true);
    try {
      await onSubmit?.(form);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: FieldDef) => {
    if (f.hidden?.(form)) return null;
    const value = form[f.key];
    const invalid = !!errors[f.key];
    const disabled = isDisabled(f, form, mode);
    const opts = toOptions(f.options);
    const wrap = (content: ReactNode) => (
      <div key={f.key} className={f.full || f.type === 'textarea' || f.type === 'photos' ? 'sm:col-span-2' : ''}>
        <label className={`block text-xs font-semibold uppercase mb-1 ${invalid ? 'text-red-600' : 'text-slate-500'}`}>
          {f.label}{!view && isRequired(f, form) && <span className="text-red-500"> *</span>}
        </label>
        {content}
      </div>
    );

    // Visualizar: somente texto, sem caixas de digitação
    if (view) {
      let text: ReactNode = value;
      if (f.type === 'currency') text = formatCurrency(value);
      else if (f.type === 'date') text = formatDate(value);
      else if (f.type === 'select' || f.type === 'search-select') text = opts.find(o => String(o.value) === String(value))?.label ?? value;
      else if (f.type === 'toggle') text = value;
      else if (f.type === 'photo') return wrap(<Avatar src={value} name={form.nome} />);
      else if (f.type === 'photos') return wrap(<Gallery photos={parsePhotos(value)} />);
      if (!isEmpty(text) && f.suffix) text = `${text} ${f.suffix}`;
      return wrap(<p className="py-2 text-slate-800 font-medium border-b border-slate-100 min-h-[2.5rem] whitespace-pre-wrap">{isEmpty(text) ? <span className="text-slate-300">—</span> : text}</p>);
    }

    switch (f.type) {
      case 'textarea':
        return wrap(<textarea rows={3} disabled={disabled} className={inputClass(invalid)} value={value ?? ''} onChange={e => set(f, e.target.value)} placeholder={f.placeholder} />);
      case 'select':
        return wrap(
          <select disabled={disabled} className={inputClass(invalid)} value={value ?? ''} onChange={e => set(f, e.target.value)}>
            <option value="">Selecione...</option>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'search-select':
        return wrap(<SearchSelect value={value} options={opts} disabled={disabled} invalid={invalid} onChange={v => set(f, v)} />);
      case 'currency':
        return wrap(<input disabled={disabled} inputMode="numeric" className={inputClass(invalid)} value={formatCurrency(value)} placeholder="R$ 0,00" onChange={e => set(f, parseCurrencyInput(e.target.value))} />);
      case 'toggle': {
        const [on, off] = opts.map(o => o.value);
        const active = value === on;
        return wrap(
          <button type="button" disabled={disabled} onClick={() => set(f, active ? off : on)} className="flex items-center gap-3 py-1.5">
            <span className={`w-11 h-6 rounded-full relative transition ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
            <span className={`font-semibold text-sm ${active ? 'text-emerald-700' : 'text-slate-500'}`}>{String(active ? on : off)}</span>
          </button>
        );
      }
      case 'photo':
        return wrap(<PhotoInput value={value} name={form.nome} disabled={disabled} onChange={v => set(f, v)} />);
      case 'photos':
        return wrap(<PhotosInput value={parsePhotos(value)} onChange={v => set(f, JSON.stringify(v))} />);
      default:
        return wrap(
          <div className="relative">
            <input
              type={f.type || 'text'} disabled={disabled} className={inputClass(invalid)} placeholder={f.placeholder}
              value={value ?? ''} onChange={e => set(f, f.mask ? f.mask(e.target.value) : e.target.value)}
            />
            {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{f.suffix}</span>}
          </div>
        );
    }
  };

  const current = tabs[tab];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white text-slate-500" title="Voltar"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      </div>

      <form onSubmit={submit} className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
        {tabs.length > 1 && (
          <div className="flex border-b px-4 sm:px-6 pt-3 gap-5 text-sm font-semibold text-slate-500 overflow-x-auto">
            {tabs.map((t, i) => {
              const hasError = allFields.some(f => f.tab === i && errors[f.key]);
              return (
                <button type="button" key={t.label} onClick={() => setTab(i)}
                  className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${tab === i ? 'border-[#0a2540] text-[#0a2540]' : 'border-transparent hover:text-slate-800'} ${hasError ? 'text-red-600' : ''}`}>
                  {t.label}{hasError && ' •'}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-4 sm:p-6 bg-slate-50/60 min-h-[18rem]">
          {tab === 0 && (
            <div className="mb-4 max-w-[12rem]">
              <label className="block text-xs font-semibold uppercase mb-1 text-slate-500">ID</label>
              {view
                ? <p className="py-2 font-mono text-slate-800 border-b border-slate-100">#{form.id}</p>
                : <input disabled className={inputClass(false)} value={form.id ? `#${form.id}` : 'Automático'} />}
            </div>
          )}
          {current.fields && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{current.fields.map(renderField)}</div>}
          {current.render?.(form, mode)}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t bg-white flex flex-wrap justify-between gap-3">
          {view ? (
            <>
              <button type="button" onClick={onBack} className="px-6 py-2.5 bg-[#0a2540] text-white rounded-lg font-bold hover:bg-[#06182c]">Voltar</button>
              {onEdit && <button type="button" onClick={onEdit} className="px-5 py-2.5 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50">{editLabel}</button>}
            </>
          ) : (
            <>
              <div className="flex gap-3">
                <button type="button" onClick={() => (cancelConfirm ? setConfirmCancel(true) : onBack())} className="px-5 py-2.5 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                {showClear && mode === 'create' && (
                  <button type="button" onClick={() => { setForm({ ...defaults }); setErrors({}); setTab(0); }} className="px-5 py-2.5 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">Limpar Formulário</button>
                )}
              </div>
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}{submitLabel}
              </button>
            </>
          )}
        </div>
      </form>

      {confirmCancel && cancelConfirm && (
        <ConfirmModal message={cancelConfirm} onConfirm={onBack} onCancel={() => setConfirmCancel(false)} />
      )}
    </div>
  );
}

export function Avatar({ src, name, size = 'lg' }: { src?: string; name?: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-24 h-24 text-2xl' : 'w-9 h-9 text-xs';
  return src
    ? <img src={src} alt={name} className={`${cls} rounded-full object-cover border`} />
    : <div className={`${cls} rounded-full bg-[#0a2540] text-white flex items-center justify-center font-bold shrink-0`}>{initials(name)}</div>;
}

function PhotoInput({ value, name, disabled, onChange }: { value?: string; name?: string; disabled?: boolean; onChange: (v: string | null) => void }) {
  const toast = useToast();
  return (
    <div className="flex items-center gap-4">
      <Avatar src={value} name={name} />
      {!disabled && (
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">
            <Camera size={16} /> Escolher foto
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async e => {
              const file = e.target.files?.[0];
              if (file) onChange(await imageToDataUrl(file, 400).catch(() => { toast.error('Não foi possível ler a imagem.'); return null; }));
              e.target.value = '';
            }} />
          </label>
          {value && <button type="button" onClick={() => onChange(null)} className="text-xs text-red-600 hover:underline text-left">Remover foto</button>}
        </div>
      )}
    </div>
  );
}

function PhotosInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {value.map((src, i) => (
        <div key={i} className="relative group aspect-[4/3] rounded-lg overflow-hidden border bg-slate-100">
          <img src={src} className="w-full h-full object-cover" />
          {i === 0 && <span className="absolute left-2 top-2 text-[10px] font-bold bg-white/90 px-2 py-0.5 rounded">PRINCIPAL</span>}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-2 top-2 bg-white/90 rounded-full p-1 text-red-600 hover:bg-white"><X size={14} /></button>
        </div>
      ))}
      <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 text-sm cursor-pointer hover:border-sky-500 hover:text-sky-600 bg-white">
        {loading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        <span className="mt-1 font-semibold">Adicionar fotos</span>
        <span className="text-xs text-slate-400">JPG ou PNG</span>
        <input type="file" multiple accept="image/png,image/jpeg" className="hidden" onChange={async e => {
          const files = Array.from(e.target.files || []);
          e.target.value = '';
          setLoading(true);
          try {
            onChange([...value, ...(await Promise.all(files.map(f => imageToDataUrl(f))))]);
          } catch {
            toast.error('Uma das imagens não pôde ser lida. Use arquivos JPG ou PNG.');
          } finally {
            setLoading(false);
          }
        }} />
      </label>
    </div>
  );
}

export function Gallery({ photos }: { photos: string[] }) {
  if (!photos.length) return <p className="text-slate-400 py-2">Nenhuma foto cadastrada.</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {photos.map((src, i) => (
        <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden border bg-slate-100">
          <img src={src} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}
