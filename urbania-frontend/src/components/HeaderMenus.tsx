import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, BellRing, CheckCheck, ChevronDown, LayoutGrid, LogOut, Settings, UserRound } from 'lucide-react';
import { Pode, useAuth } from '../lib/auth';
import { tempoRelativo, useAlertas } from '../lib/alertas';
import type { Alerta } from '../lib/alertas';

// Abre/fecha um menu suspenso e fecha ao clicar fora ou apertar Esc
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return { open, setOpen, ref };
}

const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`absolute right-0 top-full mt-2.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden ${className}`}>{children}</div>
);

const TOM_COR = { urgente: 'bg-rose-500', aviso: 'bg-amber-500', info: 'bg-sky-500' };

// Um aviso da lista (usado no menu do sininho e na página "Todas as notificações")
export function AlertaItem({ alerta, lida, onOpen }: { alerta: Alerta; lida: boolean; onOpen: (a: Alerta) => void }) {
  return (
    <button type="button" onClick={() => onOpen(alerta)}
      className={`w-full text-left flex gap-3 px-4 py-3 transition-colors border-b border-slate-100 last:border-b-0 ${lida ? 'bg-white hover:bg-slate-50' : 'bg-sky-50/60 hover:bg-sky-50'}`}>
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${lida ? 'bg-slate-200' : TOM_COR[alerta.tom]}`} />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm leading-snug ${lida ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>{alerta.titulo}</span>
        {alerta.descricao && <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2">{alerta.descricao}</span>}
        <span className="flex justify-between items-center gap-2 mt-1">
          <span className="text-[11px] text-slate-400">{tempoRelativo(alerta.data)}</span>
          {alerta.acao && <span className="text-[11px] font-semibold text-sky-600 inline-flex items-center gap-0.5">{alerta.acao} <ArrowRight size={12} /></span>}
        </span>
      </span>
    </button>
  );
}

// Sininho do cabeçalho com a lista de avisos
export function NotificationsMenu() {
  const { open, setOpen, ref } = useDropdown();
  const navigate = useNavigate();
  const { alertas, loading, lidas, naoLidas, marcarLida, marcarTodas, recarregar } = useAlertas();

  const abrirAviso = (a: Alerta) => {
    marcarLida(a.id);
    setOpen(false);
    navigate(a.link);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { if (!open) recarregar(); setOpen(!open); }} title="Notificações"
        className={`relative p-2 rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${open ? 'bg-sky-50 text-sky-600 ring-2 ring-sky-200' : 'text-slate-500 hover:text-sky-600 hover:bg-slate-100'}`}>
        {naoLidas ? <BellRing size={20} /> : <Bell size={20} />}
        {naoLidas > 0 && (
          // Badge quadrado no canto superior direito
          <span className="absolute top-0 right-0 min-w-[15px] h-[15px] px-[3px] bg-[#be123c] text-white text-[9px] font-bold leading-none flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <Panel className="w-96 max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:w-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <p className="font-bold text-slate-800">Notificações</p>
            <button type="button" onClick={marcarTodas} disabled={!naoLidas}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 disabled:text-slate-300 inline-flex items-center gap-1">
              <CheckCheck size={14} /> Marcar todas como lidas
            </button>
          </div>

          {/* Atalho para o gerenciamento das regras de notificação */}
          <Pode acao="Visualizar" modulo="notificacoes"><Link to="/notificacoes" onClick={() => setOpen(false)}
            className="mx-4 mb-3 flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition group">
            <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-sky-600 flex items-center justify-center shrink-0"><LayoutGrid size={16} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-slate-800">Visão geral</span>
              <span className="block text-[11px] text-slate-500">Gerenciar regras e envios automáticos</span>
            </span>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition" />
          </Link></Pode>

          <div className="max-h-[22rem] overflow-y-auto border-t border-slate-100">
            {loading && !alertas.length ? (
              <p className="p-6 text-center text-sm text-slate-400">Carregando...</p>
            ) : !alertas.length ? (
              <div className="p-8 text-center">
                <CheckCheck className="mx-auto text-emerald-500" size={28} />
                <p className="mt-2 text-sm font-semibold text-slate-700">Tudo em dia!</p>
                <p className="text-xs text-slate-400">Nenhuma pendência no momento.</p>
              </div>
            ) : alertas.slice(0, 15).map(a => <AlertaItem key={a.id} alerta={a} lida={lidas.includes(a.id)} onOpen={abrirAviso} />)}
          </div>

          <Link to="/avisos" onClick={() => setOpen(false)} className="block text-center py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50 border-t border-slate-100">
            Ver todas as notificações{alertas.length > 15 ? ` (${alertas.length})` : ''}
          </Link>
        </Panel>
      )}
    </div>
  );
}

// Nome do usuário no cabeçalho com o menu Perfil / Configurações / Sair
export function UserMenu() {
  const { open, setOpen, ref } = useDropdown();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const nome = user?.nome || 'Imobiliária';
  const iniciais = nome.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const ir = (path: string) => { setOpen(false); navigate(path); };
  const sair = () => { setOpen(false); logout(); navigate('/login', { replace: true }); };

  const item = 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition';

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${open ? 'border-sky-300 bg-sky-50/70 shadow-xs' : 'border-slate-200/80 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/70'}`}>
        <span className="w-8 h-8 rounded-lg bg-[#0a2540] flex items-center justify-center text-white font-bold text-xs shadow-xs">{iniciais}</span>
        <span className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 leading-tight max-w-[12rem] truncate">{nome}</span>
          <span className="text-[11px] text-teal-600 font-semibold">{user?.perfilNome || user?.cargo || 'Administrador'}</span>
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <Panel className="w-60 py-1.5">
          <div className="px-4 py-2.5 border-b border-slate-100 mb-1.5 sm:hidden">
            <p className="text-sm font-bold text-slate-800 truncate">{nome}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button type="button" onClick={() => ir('/perfil')} className={item}><UserRound size={16} className="text-slate-500" /> Perfil</button>
          <Pode acao="Visualizar" modulo="configuracoes"><button type="button" onClick={() => ir('/configuracoes')} className={item}><Settings size={16} className="text-slate-500" /> Configurações</button></Pode>
          <div className="my-1.5 border-t border-slate-100" />
          <button type="button" onClick={sair} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"><LogOut size={16} /> Sair</button>
        </Panel>
      )}
    </div>
  );
}
