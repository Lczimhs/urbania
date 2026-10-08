import { useEffect, useState } from 'react';

export type Tema = 'claro' | 'escuro';
const CHAVE = 'urbania_tema';

// Tema salvo neste navegador (o index.html já aplica a classe antes do React, para não "piscar" claro)
const lerTema = (): Tema => {
  try {
    return localStorage.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro';
  } catch {
    return 'claro';
  }
};

// Tema claro/escuro: liga a classe .dark no <html> (ver @custom-variant dark e theme-dark.css)
export function useTema() {
  const [tema, setTema] = useState<Tema>(lerTema);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro');
    document.documentElement.style.colorScheme = tema === 'escuro' ? 'dark' : 'light';
    try { localStorage.setItem(CHAVE, tema); } catch { /* navegador sem armazenamento */ }
  }, [tema]);

  return { tema, alternar: () => setTema(t => (t === 'escuro' ? 'claro' : 'escuro')) };
}
