import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CornerDownLeft, Search, UserSquare2, Users } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../lib/auth';
import { matches } from './DataTable';

export type PaletteItem = { path: string; label: string; icon: ReactNode; grupo: string };
type Resultado = { key: string; titulo: string; detalhe: string; icon: ReactNode; path: string; secao: string };

// Registros pesquisáveis pela busca (só carrega os que o perfil pode visualizar)
const FONTES = [
  { modulo: 'clientes', secao: 'Clientes', icon: <Users size={16} />, titulo: (r: any) => r.nome, detalhe: (r: any) => r.email || r.telefone },
  { modulo: 'proprietarios', secao: 'Proprietários', icon: <UserSquare2 size={16} />, titulo: (r: any) => r.nome, detalhe: (r: any) => r.cpfCnpj || r.telefone },
  { modulo: 'imoveis', secao: 'Imóveis', icon: <Building2 size={16} />, titulo: (r: any) => r.titulo, detalhe: (r: any) => [r.bairro, r.cidade].filter(Boolean).join(' - ') },
];
const POR_SECAO = 5;

// Busca global "Buscar ou ir para…" (botão do cabeçalho ou Ctrl/Cmd+K)
// fechando: o painel continua na tela enquanto a animação de fechar roda; no fim chama onFechado
export function CommandPalette({ items, fechando = false, onClose, onFechado }: {
  items: PaletteItem[]; fechando?: boolean; onClose: () => void; onFechado: () => void;
}) {
  const navigate = useNavigate();
  const { pode } = useAuth();
  const [termo, setTermo] = useState('');
  const [ativo, setAtivo] = useState(0);
  const [registros, setRegistros] = useState<Record<string, any[]>>({});
  const listaRef = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora do painel (o clique no próprio botão da barra é tratado pelo cabeçalho)
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!painelRef.current?.contains(alvo) && !(alvo as Element).closest?.('[data-busca-gatilho]')) onClose();
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [onClose]);

  // Sem animação (reduzir movimento) não há animationend: remove na hora. O timer é só uma garantia.
  useEffect(() => {
    if (!fechando) return;
    if (!painelRef.current || getComputedStyle(painelRef.current).animationName === 'none') { onFechado(); return; }
    const garantia = setTimeout(onFechado, 400);
    return () => clearTimeout(garantia);
  }, [fechando, onFechado]);

  // Carrega os registros uma vez ao abrir
  useEffect(() => {
    FONTES.filter(f => pode(f.modulo)).forEach(f => {
      api.get(`/${f.modulo}`).then(r => setRegistros(cur => ({ ...cur, [f.modulo]: r.data }))).catch(() => {});
    });
  }, [pode]);

  const resultados = useMemo<Resultado[]>(() => {
    const t = termo.trim();
    const modulos = items
      .filter(i => matches(t, i.label, i.grupo))
      .map(i => ({ key: `m${i.path}`, titulo: i.label, detalhe: i.grupo, icon: i.icon, path: i.path, secao: 'Ir para' }));
    if (t.length < 2) return modulos;
    const achados = FONTES.flatMap(f => (registros[f.modulo] || [])
      .filter(r => matches(t, f.titulo(r), f.detalhe(r), r.id))
      .slice(0, POR_SECAO)
      .map(r => ({ key: `${f.modulo}${r.id}`, titulo: f.titulo(r) || `#${r.id}`, detalhe: f.detalhe(r) || '', icon: f.icon, path: `/${f.modulo}/${r.id}`, secao: f.secao })));
    return [...modulos, ...achados];
  }, [termo, items, registros]);

  // Mantém o item ativo visível ao navegar pelo teclado
  useEffect(() => {
    listaRef.current?.querySelector(`[data-index="${ativo}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [ativo]);

  const abrir = (r?: Resultado) => {
    if (!r) return;
    onClose();
    navigate(r.path);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo(a => Math.min(a + 1, resultados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); abrir(resultados[ativo]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    // Abre no lugar da própria barra de busca: o campo fica onde a barra estava e os resultados descem abaixo.
    // Abaixo de 900px (barra vira só o ícone) abre como painel no topo da tela.
    <div ref={painelRef} role="dialog" aria-label="Buscar ou ir para"
      onAnimationEnd={e => { if (fechando && e.target === e.currentTarget) onFechado(); }}
      className={`busca-painel ${fechando ? 'busca-fechando pointer-events-none' : ''} absolute right-0 -top-1 z-30 w-[520px] bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-900/15 overflow-hidden max-[900px]:fixed max-[900px]:inset-x-3 max-[900px]:top-3 max-[900px]:w-auto`}>
      <div>
        <div className="flex items-center gap-3 px-4 border-b border-slate-200">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            autoFocus value={termo} onChange={e => { setTermo(e.target.value); setAtivo(0); }} onKeyDown={onKeyDown}
            placeholder="Buscar clientes, imóveis, proprietários ou ir para um módulo…"
            role="combobox" aria-expanded="true" aria-controls="busca-resultados" aria-activedescendant={resultados[ativo] ? `busca-${ativo}` : undefined}
            className="flex-1 h-12 bg-transparent outline-none text-[15px] text-slate-800 placeholder:text-slate-400"
          />
          <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div ref={listaRef} id="busca-resultados" role="listbox" className="busca-conteudo max-h-[60vh] overflow-y-auto py-2">
          {!resultados.length && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Nada encontrado para "{termo}".</p>
          )}
          {resultados.map((r, i) => (
            <div key={r.key}>
              {(i === 0 || resultados[i - 1].secao !== r.secao) && (
                <p className="px-4 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-widest text-slate-400">{r.secao}</p>
              )}
              <button
                type="button" id={`busca-${i}`} data-index={i} role="option" aria-selected={i === ativo}
                onMouseMove={() => setAtivo(i)} onClick={() => abrir(r)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === ativo ? 'bg-sky-50' : ''}`}
              >
                <span className={`shrink-0 ${i === ativo ? 'text-sky-600' : 'text-slate-400'}`}>{r.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800 truncate">{r.titulo}</span>
                  {r.detalhe && <span className="block text-xs text-slate-500 truncate">{r.detalhe}</span>}
                </span>
                {i === ativo
                  ? <CornerDownLeft size={14} className="text-sky-600 shrink-0" />
                  : <ArrowRight size={14} className="text-slate-300 shrink-0" />}
              </button>
            </div>
          ))}
        </div>

        <div className="busca-conteudo px-4 py-2.5 border-t border-slate-200 flex gap-4 text-[11px] text-slate-400">
          <span><kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> navegar</span>
          <span><kbd className="font-sans">Enter</kbd> abrir</span>
          <span><kbd className="font-sans">Esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}
