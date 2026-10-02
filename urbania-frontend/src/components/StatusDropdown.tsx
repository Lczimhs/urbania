import { useState } from 'react';
import { api } from '../api';
import { usePodeNaRota } from '../lib/auth';
import { statusColor } from '../lib/options';
import { Select } from './Select';
import { apiError, useToast } from './Toast';

const dropdownColor = (value: string) => value === 'Cancelado' ? 'bg-red-100 text-red-700' : statusColor(value);

export function StatusDropdown({ value, options, onChange, color = dropdownColor, disabled = false }: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  color?: (value: string) => string;
  disabled?: boolean;
}) {
  const pode = usePodeNaRota();
  return (
    <span className={`inline-flex rounded-full ${color(value)}`} onClick={e => e.stopPropagation()}>
      <Select value={value} onChange={next => { if (next !== value) onChange(next); }}
        disabled={disabled || !pode('Editar')} title="Alterar status"
        className="system-status-select text-xs font-medium">
        {[...new Set([value, ...options])].filter(Boolean).map(option => <option key={option} value={option}>{option}</option>)}
      </Select>
    </span>
  );
}

export function RecordStatusDropdown({ entity, record, options, onSaved, color = dropdownColor }: {
  entity: string;
  record: { id: number; status?: string };
  options: string[];
  onSaved: () => void;
  color?: (value: string) => string;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const change = async (status: string) => {
    setSaving(true);
    try {
      await api.put(`/${entity}/${record.id}`, { status });
      onSaved();
      toast.success('Status atualizado com sucesso!');
    } catch (err) {
      toast.error(apiError(err, 'Erro ao atualizar o status.'));
    } finally {
      setSaving(false);
    }
  };
  return <StatusDropdown value={record.status || options[0]} options={options} onChange={change} color={color} disabled={saving} />;
}
