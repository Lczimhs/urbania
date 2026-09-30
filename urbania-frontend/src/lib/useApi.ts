import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

// Carrega a lista de uma tabela. Ex.: useList('visitas', { clienteId: 3 })
export function useList<T = any>(entity: string, params?: Record<string, unknown>, enabled = true) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params || {});

  const reload = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    api.get(`/${entity}`, { params })
      .then(r => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [entity, key, enabled]);

  useEffect(reload, [reload]);
  return { rows, setRows, loading, reload };
}

// Carrega um único registro pelo id (não faz nada quando id é undefined, ex.: tela de cadastro)
export function useRecord<T = any>(entity: string, id?: string) {
  const [record, setRecord] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/${entity}/${id}`)
      .then(r => setRecord(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [entity, id]);

  return { record, loading, notFound };
}
