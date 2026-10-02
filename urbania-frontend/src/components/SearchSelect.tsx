import { Select } from './Select';
export type Option = { value: string | number; label: string; hint?: string };
export function SearchSelect({ value, onChange, options, placeholder = 'Selecione...', disabled, invalid }: {
 value: unknown; onChange: (v: string | number | null) => void; options: Option[]; placeholder?: string; disabled?: boolean; invalid?: boolean;
}) {
 return <Select value={value} disabled={disabled} aria-invalid={invalid} aria-label={placeholder} searchable
 options={[{ value: '', label: placeholder }, ...options.map(option => ({ ...option, value: String(option.value) }))]}
 onChange={selected => onChange(selected === '' ? null : options.find(option => String(option.value) === selected)?.value ?? null)} />;
}
