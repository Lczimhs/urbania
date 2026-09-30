const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatCurrency = (v: unknown) =>
  v === null || v === undefined || v === '' || isNaN(Number(v)) ? '' : brl.format(Number(v));

// Converte o texto digitado em um campo monetário para número (ex.: "R$ 1.234,56" -> 1234.56)
export const parseCurrencyInput = (text: string) => {
  const d = text.replace(/\D/g, '');
  return d === '' ? null : Number(d) / 100;
};

// "2026-09-30" -> "30/09/2026"
export const formatDate = (v: unknown) => {
  const s = String(v ?? '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const initials = (name: unknown) => {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
};

export const fullAddress = (r: Record<string, any> | undefined) => {
  if (!r) return '';
  const street = [r.logradouro, r.numero].filter(Boolean).join(', ');
  const city = [r.cidade, r.uf].filter(Boolean).join('/');
  return [street, r.complemento, r.bairro, city, r.cep].filter(Boolean).join(' - ');
};
