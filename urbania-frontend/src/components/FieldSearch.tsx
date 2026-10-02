import { useState } from 'react';
import { FilterSelect, SearchInput, matches } from './DataTable';

export type SearchField<T> = { value: string; label: string; get: (row: T) => unknown };

// ComboBox que escolhe o campo + busca aplicada sobre ele
export function useFieldSearch<T>(fields: SearchField<T>[]) {
  const [campo, setCampo] = useState('');
  const [term, setTerm] = useState('');

  const filter = (row: T) => {
    if (!term) return true;
    if (campo) {
      const f = fields.find(x => x.value === campo);
      return f ? matches(term, f.get(row)) : true;
    }
    return fields.some(f => matches(term, f.get(row)));
  };

  const selectedField = fields.find(f => f.value === campo);
  const placeholder = selectedField
    ? `Buscar por ${selectedField.label.toLowerCase()}...`
    : `Buscar por ${fields.map(f => f.label.toLowerCase()).join(', ')}...`;

  const controls = (
    <>
      <SearchInput value={term} onChange={setTerm} placeholder={placeholder} />
      <FilterSelect
        value={campo}
        onChange={v => setCampo(v || '')}
        placeholder="Todos os campos"
        options={fields.map(f => ({ value: f.value, label: f.label }))}
      />
    </>
  );

  return { filter, controls, term, setTerm, campo, setCampo };
}
