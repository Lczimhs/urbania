import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  DollarSign,
  FileText,
  Handshake,
  HardHat,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Radio,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  UserSquare2,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useConfig } from '../lib/config';
import logoImg from '../assets/logo.png';

type NavItem = { path: string; label: string; icon: ReactNode };
type NavSection = { id: string; title: string; items: NavItem[]; collapsible?: boolean };

// Organização do menu lateral por área de trabalho
const sections: NavSection[] = [
  { id: 'principal', title: 'Principal', items: [
    { path: '/', label: 'Painel', icon: <LayoutDashboard size={18} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <BarChart3 size={18} /> },
  ] },
  { id: 'crm', title: 'CRM', items: [
    { path: '/clientes', label: 'Clientes', icon: <Users size={18} /> },
    { path: '/proprietarios', label: 'Proprietários', icon: <UserSquare2 size={18} /> },
    { path: '/visitas', label: 'Visitas', icon: <Calendar size={18} /> },
    { path: '/negociacoes', label: 'Negociações', icon: <Handshake size={18} /> },
  ] },
  { id: 'operacoes', title: 'Operações', items: [
    { path: '/imoveis', label: 'Imóveis', icon: <Building2 size={18} /> },
    { path: '/contratos', label: 'Contratos', icon: <FileText size={18} /> },
    { path: '/anuncios', label: 'Anúncios', icon: <Megaphone size={18} /> },
    { path: '/canais', label: 'Canais de Publicação', icon: <Radio size={18} /> },
  ] },
  { id: 'financeiro', title: 'Financeiro', collapsible: true, items: [
    { path: '/financeiro', label: 'Lançamentos', icon: <DollarSign size={18} /> },
    { path: '/despesas', label: 'Despesas', icon: <Receipt size={18} /> },
    { path: '/multas', label: 'Multas', icon: <AlertTriangle size={18} /> },
  ] },
  { id: 'manutencao', title: 'Manutenção', collapsible: true, items: [
    { path: '/servicos', label: 'Serviços', icon: <ClipboardList size={18} /> },
    { path: '/prestadores', label: 'Prestadores', icon: <HardHat size={18} /> },
    { path: '/reparos', label: 'Reparos', icon: <Wrench size={18} /> },
  ] },
  { id: 'admin', title: 'Administração', items: [
    { path: '/funcionarios', label: 'Funcionários', icon: <BadgeCheck size={18} /> },
    { path: '/perfis', label: 'Perfis de Acesso', icon: <ShieldCheck size={18} /> },
    { path: '/notificacoes', label: 'Notificações', icon: <Bell size={18} /> },
    { path: '/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
  ] },
];

const allItems = sections.flatMap(s => s.items);

// Módulo ativo também nas subpáginas (ex.: /clientes/3/editar)
const isActive = (path: string, current: string) => (path === '/' ? current === '/' : current === path || current.startsWith(path + '/'));

// Preferências do menu (recolhido / grupos fechados) lembradas neste navegador
const lerPreferencia = <T,>(chave: string, padrao: T): T => {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : padrao;
  } catch {
    return padrao;
  }
};
const salvarPreferencia = (chave: string, valor: unknown) => {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* navegador sem armazenamento */ }
};

export default function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const currentModule = allItems.find(x => isActive(x.path, loc.pathname));
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => lerPreferencia('urbania_menu_recolhido', false));
  const [closedGroups, setClosedGroups] = useState<string[]>(() => lerPreferencia('urbania_menu_grupos_fechados', []));

  // No celular o menu fecha sozinho ao trocar de página
  useEffect(() => setMenuOpen(false), [loc.pathname]);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    salvarPreferencia('urbania_menu_recolhido', !collapsed);
  };

  const toggleGroup = (id: string) => {
    const next = closedGroups.includes(id) ? closedGroups.filter(g => g !== id) : [...closedGroups, id];
    setClosedGroups(next);
    salvarPreferencia('urbania_menu_grupos_fechados', next);
  };

  const initials = user?.nome
    ? user.nome
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'UB';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // No celular o menu sempre aparece completo (gaveta); recolher só vale em telas maiores
  const mini = collapsed && !menuOpen;
  const nomeImobiliaria = config.nomeFantasia || 'Urbânia';

  return (
    <div className="flex h-screen bg-[#F0F4F8] font-sans text-slate-800">

      {/* SIDEBAR (gaveta no celular, fixa a partir de telas médias) */}
      {menuOpen && <div className="fixed inset-0 bg-slate-900/40 z-30 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 shrink-0 bg-[#0a2540] text-slate-300 flex flex-col transition-all duration-200 w-64 ${mini ? 'md:w-[76px]' : ''} ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xl`}>

        {/* Marca + botão recolher */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0 ${mini ? 'md:justify-center md:px-0' : ''}`}>
          <div className="bg-white p-1 rounded-lg shadow shrink-0">
            <img src={config.logo || logoImg} alt={`${nomeImobiliaria} Logotipo`} className="h-8 w-8 object-contain" />
          </div>
          <div className={`flex flex-col min-w-0 flex-1 ${mini ? 'md:hidden' : ''}`}>
            <span className="text-white font-extrabold text-[15px] tracking-wide leading-tight truncate">{nomeImobiliaria}</span>
            <span className="text-[10px] text-teal-400 font-bold tracking-wider uppercase truncate">Imobiliária</span>
          </div>
          <button
            type="button" onClick={toggleCollapsed} title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={`hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition ${mini ? 'md:absolute md:-right-3 md:top-5 md:bg-[#0a2540] md:border md:border-white/20 md:p-1 md:rounded-full' : ''}`}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-4">
          {sections.map(section => {
            const hasActive = section.items.some(i => isActive(i.path, loc.pathname));
            const open = !section.collapsible || mini || hasActive || !closedGroups.includes(section.id);
            return (
              <div key={section.id}>
                {mini ? (
                  <div className="hidden md:block h-px bg-white/10 mx-2 mb-2" />
                ) : section.collapsible ? (
                  <button type="button" onClick={() => toggleGroup(section.id)}
                    className="w-full flex items-center justify-between px-2 mb-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-200">
                    {section.title}
                    <ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <p className="px-2 mb-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</p>
                )}
                {open && (
                  <div className="space-y-0.5">
                    {section.items.map(item => {
                      const active = isActive(item.path, loc.pathname);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={mini ? item.label : undefined}
                          className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13.5px] font-medium transition-colors ${mini ? 'md:justify-center' : ''} ${active ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30' : 'hover:bg-white/[0.07] hover:text-white'}`}
                        >
                          <span className={`shrink-0 ${active ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                          <span className={`truncate ${mini ? 'md:hidden' : ''}`}>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Usuário logado + Sair */}
        <div className={`p-3 border-t border-white/10 flex items-center gap-2 shrink-0 ${mini ? 'md:flex-col md:px-2' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow" title={mini ? user?.nome : undefined}>
            {initials}
          </div>
          <div className={`min-w-0 flex-1 ${mini ? 'md:hidden' : ''}`}>
            <p className="text-white text-xs font-bold leading-tight truncate">{user?.nome || 'Imobiliária'}</p>
            <p className="text-slate-400 text-[11px] truncate">{user?.email || user?.cargo || 'Administrador'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Encerrar Sessão"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="h-16 bg-white flex items-center justify-between px-4 md:px-8 shadow-sm z-10">
          <div className="text-sky-700 font-medium text-sm flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="md:hidden p-1 -ml-1 text-slate-600" title="Menu"><Menu size={24} /></button>
            <span className="font-semibold text-slate-900">{nomeImobiliaria}</span>
            {currentModule && currentModule.path !== '/' ? <span className="text-slate-400">/</span> : null}
            {currentModule && currentModule.path !== '/' ? <span className="text-sky-600 font-semibold">{currentModule.label}</span> : null}
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/notificacoes" className="relative p-2 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg transition" title="Notificações">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Link>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#0a2540] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">{user?.nome || 'Imobiliária'}</span>
                <span className="text-[11px] text-teal-600 font-medium">{user?.cargo || 'Administrador'}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 sm:ml-2 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                title="Sair do sistema"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
