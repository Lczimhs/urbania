import { useState } from 'react';
import { api } from '../api';
import { ConfirmModal } from './Modal';
import { apiError, useToast } from './Toast';

// Exclusão com modal de confirmação. A API recusa (409) quando há vínculos, e a mensagem vira um aviso.
export function useDelete(entity: string, singular: string, onDone: () => void) {
  const [target, setTarget] = useState<{ id: number; label: string } | null>(null);
  const toast = useToast();

  const confirm = async () => {
    if (!target) return;
    try {
      await api.delete(`/${entity}/${target.id}`);
      toast.success(`${singular} excluído com sucesso.`);
      onDone();
    } catch (err) {
      toast.error(apiError(err, `Erro ao excluir ${singular.toLowerCase()}.`));
    } finally {
      setTarget(null);
    }
  };

  const modal = target && (
    <ConfirmModal
      title={`Excluir ${singular.toLowerCase()}`}
      message={`Deseja realmente excluir "${target.label}"? Esta ação não pode ser desfeita.`}
      confirmLabel="Excluir" cancelLabel="Cancelar"
      onConfirm={confirm} onCancel={() => setTarget(null)}
    />
  );

  return { ask: (id: number, label: string) => setTarget({ id, label }), modal };
}
