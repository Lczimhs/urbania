import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useRecord } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { EntityForm } from './EntityForm';
import type { Mode, TabDef } from './EntityForm';
import { apiError, useToast } from './Toast';

type Form = Record<string, any>;

// Liga o EntityForm à API: carrega o registro, salva, mostra o aviso e volta para a consulta.
// Rotas esperadas: /base/novo (cadastrar), /base/:id (visualizar), /base/:id/editar (editar)
export function EntityPage({ mode, entity, basePath, singular, tabs, defaults = {}, validate, prepare, extraTabs, showClear, cancelConfirm, editLabel, feminine }: {
  mode: Mode;
  entity: string;
  basePath: string;
  singular: string;                                     // ex.: "Cliente"
  tabs: TabDef[];
  defaults?: Form;
  validate?: (form: Form) => string | null;
  prepare?: (form: Form, mode: Mode) => Form;            // ajustes antes de enviar
  extraTabs?: TabDef[];                                  // abas extras só na visualização/edição (ex.: relacionamentos)
  showClear?: boolean;
  cancelConfirm?: string;
  editLabel?: string;
  feminine?: boolean;                                   // concordância das mensagens (ex.: "Visita cadastrada")
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { pode } = useAuth();
  const { record, loading, notFound } = useRecord(entity, mode === 'create' ? undefined : id);

  if (loading) return <p className="text-slate-400 p-8">Carregando...</p>;
  const o = feminine ? 'a' : 'o';
  if (notFound) return <p className="text-slate-500 p-8">{singular} não encontrad{o}.</p>;

  const submit = async (form: Form) => {
    const data = { ...(prepare ? prepare(form, mode) : form) };
    delete data.id;
    try {
      if (mode === 'edit') await api.put(`/${entity}/${id}`, data);
      else await api.post(`/${entity}`, data);
      toast.success(`${singular} ${mode === 'edit' ? 'atualizad' : 'cadastrad'}${o} com sucesso!`);
      navigate(basePath);
    } catch (err) {
      toast.error(apiError(err, `Erro ao salvar ${singular.toLowerCase()}.`));
    }
  };

  const titles: Record<Mode, string> = { create: `Cadastrar ${singular}`, edit: `Editar ${singular}`, view: `Visualizar ${singular}` };
  const allTabs = mode === 'create' ? tabs : [...tabs, ...(extraTabs || [])];

  return (
    <EntityForm
      key={`${mode}-${id}`}
      title={titles[mode]}
      mode={mode}
      initial={record || defaults}
      defaults={defaults}
      tabs={allTabs}
      validate={validate}
      showClear={showClear}
      cancelConfirm={cancelConfirm}
      editLabel={editLabel}
      onSubmit={submit}
      onBack={() => navigate(basePath)}
      onEdit={pode(entity, 'Editar') ? () => navigate(`${basePath}/${id}/editar`) : undefined}
    />
  );
}

export function RelatedGrid({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-bold text-slate-700 mb-2">{title}</h3>
      <div className="bg-white border rounded-xl overflow-hidden">{children}</div>
    </div>
  );
}
