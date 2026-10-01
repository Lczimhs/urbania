import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowLeft, Building2, CalendarDays, Camera, Check, ChevronLeft, ChevronRight, ClipboardList, FileText, History, ImagePlus, Loader2, MapPin, Settings, ShieldCheck, UserRound, Wallet, X } from 'lucide-react';
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
  type?: 'text' | 'email' | 'date' | 'time' | 'number' | 'textarea' | 'select' | 'search-select' | 'currency' | 'photo' | 'photos' | 'toggle' | 'custom';
  // type 'custom': o próprio campo desenha o conteúdo (ex.: grid de serviços, modal de seleção)
  render?: (value: any, set: (value: any) => void, ctx: { form: Form; mode: Mode; disabled: boolean; invalid: boolean }) => ReactNode;
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

export type TabDef = {
  label: string;
  icon?: ReactNode;
  fields?: FieldDef[];
  render?: (form: Form, mode: Mode) => ReactNode;
  locked?: (form: Form) => string | null;   // devolve o motivo enquanto a aba estiver bloqueada
};

const toOptions = (opts: (string | Option)[] = []): Option[] => opts.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
const isRequired = (f: FieldDef, form: Form) => (typeof f.required === 'function' ? f.required(form) : !!f.required);
const isDisabled = (f: FieldDef, form: Form, mode: Mode) => (typeof f.disabled === 'function' ? f.disabled(form, mode) : !!f.disabled);
const isEmpty = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

const inputClass = (invalid = false) =>
  `w-full px-3 py-2 border ${invalid ? 'border-red-500' : 'border-slate-300'} rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#0a2540] disabled:bg-slate-100 disabled:text-slate-500`;

const stepIcon = (label: string) => {
  const name = label.toLocaleLowerCase('pt-BR');
  if (/endere|localiza/.test(name)) return <MapPin size={20} />;
  if (/foto|imagem/.test(name)) return <Camera size={20} />;
  if (/hist|vínculo|relacion/.test(name)) return <History size={20} />;
  if (/financ|banc|pagamento|valor/.test(name)) return <Wallet size={20} />;
  if (/garantia|permiss|acesso/.test(name)) return <ShieldCheck size={20} />;
  if (/imóvel|imóveis|caracter/.test(name)) return <Building2 size={20} />;
  if (/data|prazo|vigência|agenda/.test(name)) return <CalendarDays size={20} />;
  if (/pessoa|cliente|propriet|contato|funcion/.test(name)) return <UserRound size={20} />;
  if (/config|prefer/.test(name)) return <Settings size={20} />;
  if (/contrat|document|observ/.test(name)) return <FileText size={20} />;
  return <ClipboardList size={20} />;
};

// Formulário em abas reaproveitado nas telas de Cadastrar, Editar e Visualizar
export function EntityForm({ title, mode, initial, tabs, defaults = {}, onSubmit, onBack, onEdit, validate, showClear = true, cancelConfirm, submitLabel = 'Salvar', editLabel = 'Editar', hideId = false }: {
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
  hideId?: boolean;         // telas sem ID visível (ex.: Configurações)
}) {
  const [form, setForm] = useState<Form>(initial);
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const activeStep = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const view = mode === 'view';

  useEffect(() => {
    activeStep.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [tab]);

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

  const goNext = () => {
    const currentFields = (tabs[tab]?.fields || []).filter(
      f => !f.hidden?.(form) && isRequired(f, form) && isEmpty(form[f.key])
    );
    if (currentFields.length > 0) {
      setErrors(prev => ({ ...prev, ...Object.fromEntries(currentFields.map(f => [f.key, true])) }));
      toast.error('Preencha os campos obrigatórios desta etapa: ' + currentFields.map(f => f.label).join(', ') + '.');
      return;
    }
    const lockedReason = tabs[tab + 1]?.locked?.(form);
    if (lockedReason) return toast.error(lockedReason);
    setTab(cur => Math.min(cur + 1, tabs.length - 1));
  };

  const goPrev = () => {
    setTab(cur => Math.max(cur - 1, 0));
  };

  const renderField = (f: FieldDef) => {
    if (f.hidden?.(form)) return null;
    const value = form[f.key];
    const invalid = !!errors[f.key];
    const disabled = isDisabled(f, form, mode);
    const opts = toOptions(f.options);
    const wrap = (content: ReactNode) => (
      <div key={f.key} className={f.full || f.type === 'textarea' || f.type === 'photos' ? 'sm:col-span-2' : ''}>
        <label className="block text-xs font-semibold uppercase mb-1 text-slate-500">
          {f.label}{!view && isRequired(f, form) && <span className="text-red-500"> *</span>}
        </label>
        {content}
      </div>
    );

    if (f.type === 'custom') return wrap(f.render?.(value, v => set(f, v), { form, mode, disabled: view || disabled, invalid }));

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
        return wrap(<textarea rows={3} disabled={disabled} aria-invalid={invalid} className={inputClass(invalid)} value={value ?? ''} onChange={e => set(f, e.target.value)} placeholder={f.placeholder} />);
      case 'select':
        return wrap(
          <select disabled={disabled} aria-invalid={invalid} className={inputClass(invalid)} value={value ?? ''} onChange={e => set(f, e.target.value)}>
            <option value="">Selecione...</option>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'search-select':
        return wrap(<SearchSelect value={value} options={opts} disabled={disabled} invalid={invalid} onChange={v => set(f, v)} />);
      case 'currency':
        return wrap(<input disabled={disabled} aria-invalid={invalid} inputMode="numeric" className={inputClass(invalid)} value={formatCurrency(value)} placeholder="R$ 0,00" onChange={e => set(f, parseCurrencyInput(e.target.value))} />);
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
        return wrap(<PhotoInput value={value} name={form.nome} disabled={disabled} invalid={invalid} onChange={v => set(f, v)} />);
      case 'photos':
        return wrap(<PhotosInput value={parsePhotos(value)} onChange={v => set(f, JSON.stringify(v))} />);
      default:
        return wrap(
          <div className="relative">
            <input
              type={f.type || 'text'} disabled={disabled} aria-invalid={invalid} className={inputClass(invalid)} placeholder={f.placeholder}
              value={value ?? ''} onChange={e => set(f, f.mask ? f.mask(e.target.value) : e.target.value)}
            />
            {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{f.suffix}</span>}
          </div>
        );
    }
  };

  const current = tabs[tab];

  return (
    <div className="max-w-[70rem] mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white text-slate-500" title="Voltar"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      </div>

      <form onSubmit={submit} className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
        {tabs.length > 1 && (
          <nav aria-label="Etapas do formulário" className="overflow-x-auto px-4 sm:px-6 py-6">
            <ol className="mx-auto flex w-full max-w-4xl min-w-max sm:min-w-0">
              {tabs.map((t, i) => {
                const lockedReason = t.locked?.(form);
                const active = tab === i;
                return (
                  <li key={t.label} className="relative flex-1 min-w-28">
                    {i > 0 && <span aria-hidden="true" className={`absolute left-0 right-1/2 top-5 h-0.5 ${i <= tab ? 'bg-cadastro' : 'bg-slate-200'}`} />}
                    {i < tabs.length - 1 && <span aria-hidden="true" className={`absolute left-1/2 right-0 top-5 h-0.5 ${i < tab ? 'bg-cadastro' : 'bg-slate-200'}`} />}
                    <button ref={active ? activeStep : undefined} type="button" aria-current={active ? 'step' : undefined} aria-disabled={!!lockedReason}
                      onClick={() => (lockedReason ? toast.error(lockedReason) : setTab(i))} title={lockedReason || undefined}
                      className={`relative w-full flex flex-col items-center gap-2 px-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cadastro focus-visible:ring-offset-2 ${lockedReason ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer group'}`}>
                      <span aria-hidden="true" className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${i <= tab ? 'border-cadastro bg-cadastro text-white' : 'border-slate-200 bg-white text-slate-400 group-hover:border-cadastro group-hover:text-cadastro'}`}>
                        {t.icon || stepIcon(t.label)}
                      </span>
                      <span className={`text-xs sm:text-sm text-center leading-snug ${active ? 'font-bold text-cadastro' : 'font-medium text-slate-500 group-hover:text-cadastro'}`}>{t.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div className="p-4 sm:p-6 bg-slate-50/60 min-h-[18rem]">
          {tab === 0 && !hideId && mode !== 'create' && (
            <div className="mb-4 max-w-[12rem]">
              <label className="block text-xs font-semibold uppercase mb-1 text-slate-500">ID</label>
              {view
                ? <p className="py-2 font-mono text-slate-800 border-b border-slate-100">#{form.id}</p>
                : <input disabled className={inputClass()} value={form.id ? `#${form.id}` : 'Automático'} />}
            </div>
          )}
          {current.fields && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{current.fields.map(renderField)}</div>}
          {current.render?.(form, mode)}
        </div>

        <div className="px-4 sm:px-6 py-4 bg-white flex flex-wrap items-center justify-between gap-3">
          {view ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={onBack} className="px-6 py-2.5 bg-[#0a2540] text-white rounded-lg font-bold hover:bg-[#06182c] transition">
                  Voltar
                </button>
                {tabs.length > 1 && tab > 0 && (
                  <button type="button" onClick={goPrev} className="px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition">
                    <ChevronLeft size={18} /> Etapa Anterior
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {tabs.length > 1 && tab < tabs.length - 1 && (
                  <button type="button" onClick={goNext} className="px-5 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition">
                    Próxima Etapa <ChevronRight size={18} />
                  </button>
                )}
                {onEdit && (
                  <button type="button" onClick={onEdit} className="px-5 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition">
                    {editLabel}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Lado Esquerdo: Ações Auxiliares (Cancelar e Limpar) */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => (cancelConfirm ? setConfirmCancel(true) : onBack())}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                {showClear && mode === 'create' && (
                  <button
                    type="button"
                    onClick={() => { setForm({ ...defaults }); setErrors({}); setTab(0); }}
                    className="px-5 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Limpar Formulário
                  </button>
                )}
              </div>

              {/* Lado Direito: Navegação (Voltar, Próximo) e Ação Principal (Salvar) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Botão Voltar (entre abas a partir da segunda aba) */}
                {tabs.length > 1 && tab > 0 && (
                  <button
                    type="button"
                    onClick={goPrev}
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold flex items-center gap-1.5 transition"
                  >
                    <ChevronLeft size={18} /> Voltar
                  </button>
                )}

                {/* Botão Próximo no cadastro (se houver próxima aba) */}
                {mode === 'create' && tabs.length > 1 && tab < tabs.length - 1 && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="px-6 py-2.5 bg-cadastro text-white rounded-lg font-bold hover:bg-cadastro-hover flex items-center gap-2 transition shadow-sm"
                  >
                    Próximo <ChevronRight size={18} />
                  </button>
                )}

                {/* Botão Próximo na edição (para alternar abas sem submeter) */}
                {mode === 'edit' && tabs.length > 1 && tab < tabs.length - 1 && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold flex items-center gap-1.5 transition"
                  >
                    Próximo <ChevronRight size={18} />
                  </button>
                )}

                {/* Botão Salvar: No cadastro apenas na última aba (ou aba única); Na edição SEMPRE em todas as abas */}
                {(mode === 'edit' || tab === tabs.length - 1 || tabs.length <= 1) && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="save-action px-6 py-2.5 text-white rounded-lg font-bold disabled:opacity-60 flex items-center gap-2 transition shadow-sm"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                    {submitLabel}
                  </button>
                )}
              </div>
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

function PhotoInput({ value, name, disabled, invalid, onChange }: { value?: string; name?: string; disabled?: boolean; invalid?: boolean; onChange: (v: string | null) => void }) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  return (
    <div className="w-full max-w-36 sm:max-w-44">
      <button type="button" disabled={disabled || loading} aria-invalid={invalid}
        aria-label={value ? 'Alterar foto' : 'Inserir foto'} onClick={() => fileInput.current?.click()}
        className={`relative aspect-[3/4] w-full overflow-hidden rounded-2xl border bg-white flex flex-col items-center justify-center gap-2 text-cadastro transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cadastro focus-visible:ring-offset-2 disabled:cursor-default ${invalid ? 'border-red-500' : 'border-slate-300 enabled:hover:border-cadastro'} enabled:cursor-pointer`}>
        {value && <img src={value} alt={name ? `Foto de ${name}` : 'Foto selecionada'} className="absolute inset-0 h-full w-full object-cover" />}
        {loading ? <Loader2 size={28} className="relative animate-spin" /> : value ? (
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-cadastro/85 p-3 text-xs font-semibold text-white"><Camera size={16} /> Alterar foto</span>
        ) : (
          <><Camera size={28} /><span className="text-sm font-semibold">Inserir foto</span><span className="text-xs text-slate-400">JPG ou PNG</span></>
        )}
      </button>
      <input ref={fileInput} type="file" accept="image/png,image/jpeg" disabled={disabled || loading} className="hidden" onChange={async e => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setLoading(true);
        try {
          onChange(await imageToDataUrl(file, 400));
        } catch {
          toast.error('Não foi possível ler a imagem. Use arquivos JPG ou PNG.');
        } finally {
          setLoading(false);
        }
      }} />
    </div>
  );
}

function PhotosInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {value.map((src, i) => (
        <div key={i} className="relative group aspect-[4/3] rounded-lg overflow-hidden border bg-slate-100">
          <img src={src} className="w-full h-full object-cover" />
          {i === 0 && <span className="absolute left-2 top-2 text-[10px] font-bold bg-white/90 px-2 py-0.5 rounded">PRINCIPAL</span>}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-2 top-2 bg-white/90 rounded-full p-1 text-red-600 hover:bg-white"><X size={14} /></button>
        </div>
      ))}
      <button type="button" disabled={loading} onClick={() => fileInput.current?.click()}
        className="aspect-[3/4] w-full max-w-36 sm:max-w-44 rounded-2xl border border-slate-300 flex flex-col items-center justify-center text-cadastro text-sm cursor-pointer hover:border-cadastro bg-white outline-none focus-visible:ring-2 focus-visible:ring-cadastro focus-visible:ring-offset-2 disabled:cursor-wait">
        {loading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        <span className="mt-1 font-semibold">Adicionar fotos</span>
        <span className="text-xs text-slate-400">JPG ou PNG</span>
      </button>
        <input ref={fileInput} type="file" multiple accept="image/png,image/jpeg" disabled={loading} className="hidden" onChange={async e => {
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
