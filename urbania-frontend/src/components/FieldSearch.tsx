import { useState } from 'react';
import { FilterSelect, SearchInput, matches } from './DataTable';

export type SearchField<T> = { value: string; label: string; get: (row: T) => unknown };

// ComboBox que escolhe o campo + busca aplicada sobre ele (consultas de Serviço, Prestador, Reparo, Canal e Anúncio)
export function useFieldSearch<T>(fields: SearchField<T>[]) {
  const [campo, setCampo] = useState(fields[0].value);
  const [term, setTerm] = useState('');
  const field = fields.find(f => f.value === campo) || fields[0];

  const filter = (row: T) => matches(term, field.get(row));

  const controls = (
    <>
      <FilterSelect value={campo} onChange={v => setCampo(v || fields[0].value)} placeholder="Pesquisar por..."
        options={fields.map(f => ({ value: f.value, label: f.label }))} />
      <SearchInput value={term} onChange={setTerm} placeholder={`Buscar por ${field.label.toLowerCase()}...`} />
    </>
  );

  return { filter, controls };
}
