import { Select, type Item } from './Select';

export type Option = { value: string | number; label: string; hint?: string };

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled,
  invalid,
  placement = 'auto',
  className = '',
}: {
  value: unknown;
  onChange: (v: string | number | null) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  placement?: 'auto' | 'bottom';
  className?: string;
}) {
  const items: Item[] = options.map(o => ({
    value: String(o.value),
    label: o.label,
    hint: o.hint,
  }));

  return (
    <Select
      value={value !== null && value !== undefined && value !== '' ? String(value) : ''}
      options={items}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={invalid}
      aria-label={placeholder}
      className={className}
      searchable={true}
      placement={placement}
      onChange={selectedVal => {
        if (!selectedVal || selectedVal === '') {
          onChange(null);
        } else {
          const match = options.find(o => String(o.value) === selectedVal);
          onChange(match ? match.value : selectedVal);
        }
      }}
    />
  );
}
