// Máscaras aplicadas enquanto o usuário digita.
const digits = (v: unknown, max?: number) => {
  const d = String(v ?? '').replace(/\D/g, '');
  return max ? d.slice(0, max) : d;
};

export const maskCpf = (v: unknown) =>
  digits(v, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

export const maskCnpj = (v: unknown) =>
  digits(v, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');

export const maskCpfCnpj = (v: unknown) => (digits(v).length <= 11 ? maskCpf(v) : maskCnpj(v));

export const maskPhone = (v: unknown) => {
  const d = digits(v, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

export const maskCep = (v: unknown) => digits(v, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2');

export const maskRg = (v: unknown) =>
  String(v ?? '').replace(/[^\dXx]/g, '').slice(0, 10).toUpperCase();

export const onlyDigits = (v: unknown) => digits(v);
