// Busca o endereço pelo CEP (ViaCEP). Devolve null se o CEP não existir ou a consulta falhar.
export async function buscarCep(cep: string) {
  const d = cep.replace(/\D/g, '');
  if (d.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    const j = await r.json();
    if (j.erro) return null;
    return { logradouro: j.logradouro, bairro: j.bairro, cidade: j.localidade, uf: j.uf };
  } catch {
    return null;
  }
}
