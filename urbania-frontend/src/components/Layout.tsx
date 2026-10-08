import { useCallback, useEffect, useState } from 'react';
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
  Moon,
  Radio,
  Receipt,
  Settings,
  Search,
  ShieldCheck,
  Sun,
  Users,
  UserSquare2,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useConfig } from '../lib/config';
import { moduloDaRota } from '../lib/permissoes';
import { useTema } from '../lib/theme';
import { NotificationsMenu } from './HeaderMenus';
import { CommandPalette } from './CommandPalette';
import logoImg from '../assets/logo.png';

type NavItem = { path: string; label: string; icon: ReactNode };
type NavSection = { id: string; title: string; items: NavItem[]; collapsible?: boolean };

// Organização do menu lateral por área de trabalho
const sections: NavSection[] = [
  { id: 'principal', title: 'Principal', collapsible: true, items: [
    { path: '/', label: 'Painel', icon: <LayoutDashboard size={18} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <BarChart3 size={18} /> },
  ] },
  { id: 'crm', title: 'CRM', collapsible: true, items: [
    { path: '/clientes', label: 'Clientes', icon: <Users size={18} /> },
    { path: '/proprietarios', label: 'Proprietários', icon: <UserSquare2 size={18} /> },
    { path: '/visitas', label: 'Visitas', icon: <Calendar size={18} /> },
    { path: '/negociacoes', label: 'Negociações', icon: <Handshake size={18} /> },
  ] },
  { id: 'operacoes', title: 'Operações', collapsible: true, items: [
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
  { id: 'admin', title: 'Administração', collapsible: true, items: [
    { path: '/funcionarios', label: 'Funcionários', icon: <BadgeCheck size={18} /> },
    { path: '/perfis', label: 'Perfis de Acesso', icon: <ShieldCheck size={18} /> },
    { path: '/notificacoes', label: 'Notificações', icon: <Bell size={18} /> },
    { path: '/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
  ] },
];

const allItems = sections.flatMap(s => s.items);

// Grupo do menu de cada módulo, para o breadcrumb do cabeçalho (ex.: Clientes → CRM)
const grupoDoModulo = new Map(sections.flatMap(s => s.items.map(item => [item.path, s.title] as const)));

// Botões quadrados do cabeçalho (menu e tema): borda só no hover, foco visível em teal
const headerIconButton =
  'w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-[2px] border border-transparent text-slate-500 transition-colors ' +
  'hover:border-[#cdd8e3] hover:text-slate-800 dark:text-slate-300 dark:hover:border-[#1c4068] dark:hover:text-white ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488]';

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
  const { user, logout, pode } = useAuth();
  const { config } = useConfig();
  // Menu só com os módulos que o perfil pode visualizar (seções vazias somem)
  const visibleSections = sections
    .map(s => ({ ...s, items: s.items.filter(i => { const m = moduloDaRota(i.path); return !m || pode(m); }) }))
    .filter(s => s.items.length);
  const currentModule = allItems.find(x => isActive(x.path, loc.pathname));
  const grupo = currentModule && grupoDoModulo.get(currentModule.path);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => lerPreferencia('urbania_menu_recolhido', false));
  const [closedGroups, setClosedGroups] = useState<string[]>(() => lerPreferencia('urbania_menu_grupos_fechados', []));

  // No celular o menu fecha sozinho ao trocar de página
  useEffect(() => setMenuOpen(false), [loc.pathname]);

  // Busca global "Buscar ou ir para…"
  // fechando: animação de saída rodando (o painel só sai da tela no fim dela)
  const [busca, setBusca] = useState<'fechada' | 'aberta' | 'fechando'>('fechada');
  const alternarBusca = useCallback(() => setBusca(b => (b === 'aberta' ? 'fechando' : 'aberta')), []);
  const fecharBusca = useCallback(() => setBusca(b => (b === 'aberta' ? 'fechando' : b)), []);
  const buscaFechada = useCallback(() => setBusca('fechada'), []);

  const { tema, alternar: alternarTema } = useTema();

  // Atalho Ctrl+K (Cmd+K no Mac) abre/fecha a busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        alternarBusca();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [alternarBusca]);

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
          {/* Logo + nome levam para a tela inicial */}
          <Link to="/" title="Ir para o Painel" className={`flex items-center gap-3 min-w-0 flex-1 group ${mini ? 'md:flex-none' : ''}`}>
            <div className="bg-white p-1 rounded-lg shadow shrink-0 group-hover:ring-2 group-hover:ring-sky-400/50 transition">
              <img src={config.logo || logoImg} alt={`${nomeImobiliaria} Logotipo`} className="h-8 w-8 object-contain" />
            </div>
            <div className={`flex flex-col min-w-0 flex-1 ${mini ? 'md:hidden' : ''}`}>
              <span className="text-white font-extrabold text-[15px] tracking-wide leading-tight truncate">{nomeImobiliaria}</span>
              <span className="text-[10px] text-teal-400 font-bold tracking-wider uppercase truncate">Imobiliária</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={
              mini
                ? 'hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-[#0a2540] text-slate-300 hover:text-white hover:bg-sky-600 border border-white/30 shadow-md absolute -right-3 top-5 z-50 transition-colors cursor-pointer'
                : 'hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer'
            }
          >
            {collapsed ? <ChevronsRight size={13} className="ml-0.5" /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-4 sidebar-scroll">
          {visibleSections.map(section => {
            const hasActive = section.items.some(i => isActive(i.path, loc.pathname));
            const open = !section.collapsible || mini || hasActive || !closedGroups.includes(section.id);
            return (
              <div key={section.id}>
                {/* Recolhido: separador com a mesma altura do título (h-4 + mb-1), para os ícones não mudarem de posição */}
                {mini ? (
                  <div className="hidden md:flex items-center h-4 mb-1 mx-2"><div className="h-px w-full bg-white/10" /></div>
                ) : section.collapsible ? (
                  <button type="button" onClick={() => toggleGroup(section.id)}
                    className="w-full h-4 flex items-center justify-between px-2 mb-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-200">
                    {section.title}
                    <ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <p className="h-4 flex items-center px-2 mb-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">{section.title}</p>
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
                          className={`flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13.5px] font-medium transition-colors ${mini ? 'md:justify-center' : ''} ${active ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30' : 'hover:bg-white/[0.07] hover:text-white'}`}
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

        {/* Usuário logado (abre a tela de Perfil) + Sair */}
        {/* h-16 nos dois estados (igual ao cabeçalho); recolhido: avatar e Sair lado a lado */}
        <div className={`h-16 px-3 border-t border-white/10 flex items-center gap-2 shrink-0 ${mini ? 'md:px-1.5 md:gap-1 md:justify-center' : ''}`}>
          <Link
            to="/perfil" title={mini ? `${user?.nome || 'Perfil'} · Ver perfil` : 'Ver perfil'}
            className={`flex items-center gap-2 min-w-0 flex-1 -my-1 py-1 -ml-1 pl-1 rounded-lg group hover:bg-white/[0.07] transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0d9488] ${mini ? 'md:flex-none md:m-0 md:p-0' : ''} ${isActive('/perfil', loc.pathname) ? 'bg-white/[0.07]' : ''}`}
          >
            <span className={`w-9 h-9 ${mini ? 'md:w-8 md:h-8' : ''} rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow group-hover:ring-2 group-hover:ring-teal-300/40`}>
              {initials}
            </span>
            <span className={`min-w-0 flex-1 ${mini ? 'md:hidden' : ''}`}>
              <span className="block text-white text-xs font-bold leading-tight truncate">{user?.nome || 'Imobiliária'}</span>
              <span className="block text-slate-400 text-[11px] truncate">{user?.email || user?.cargo || 'Administrador'}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Encerrar Sessão"
            className={`p-2 ${mini ? 'md:p-1.5' : ''} text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer`}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT: a própria coluna é o container de rolagem, para o conteúdo passar por baixo do header */}
      <main className="flex-1 min-w-0 overflow-auto">

        {/* CABEÇALHO FIXO: sticky dentro do container que rola, com fundo translúcido + desfoque */}
        <header
          className="sticky z-20 flex items-center gap-3.5 py-3 px-6 max-[900px]:px-4 border-b border-[#cdd8e3] bg-white/[.88] backdrop-blur-[6px] dark:border-[#1c4068] dark:bg-[#0a2541]/[.88]"
          style={{ top: 'env(safe-area-inset-top, 0px)' }} // respeita o notch do iPhone; o Tailwind já gera o -webkit-backdrop-filter
        >
          {/* 1. Menu (só abaixo de md): abre a gaveta lateral */}
          <button type="button" onClick={() => setMenuOpen(true)} title="Abrir menu" aria-label="Abrir menu" className={`md:hidden ${headerIconButton}`}>
            <Menu size={18} />
          </button>

          {/* 2. Breadcrumb: Grupo / Módulo */}
          <div className="flex-1 min-w-0 flex items-baseline gap-2.5">
            <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[.08em] text-[#7f90a4]">
              {grupo && currentModule ? `${grupo} / ${currentModule.label}` : nomeImobiliaria}
            </span>
          </div>

          {/* 3. Busca (Ctrl/Cmd+K); abaixo de 900px só o ícone. O painel abre no lugar da barra. */}
          <div className="relative shrink-0">
          <button
            type="button" data-busca-gatilho onClick={alternarBusca} title="Buscar (Ctrl+K)" aria-label="Buscar ou ir para… (Ctrl+K)" aria-expanded={busca === 'aberta'}
            className="shrink-0 min-w-[220px] h-8 flex items-center gap-2 px-2.5 bg-[#f4f7fa] border border-[#cdd8e3] rounded-[2px] text-slate-500 hover:border-[#b3c2d1] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] max-[900px]:min-w-0 max-[900px]:w-8 max-[900px]:justify-center max-[900px]:px-0 dark:bg-[#0f2f52] dark:border-[#1c4068] dark:text-slate-300"
          >
            <Search size={15} className="shrink-0" />
            <span className="flex-1 text-left text-[13px] text-[#7f90a4] max-[900px]:hidden">Buscar ou ir para…</span>
            <kbd className="font-sans text-[10px] leading-none text-[#7f90a4] border border-[#cdd8e3] rounded-[2px] px-1 py-[3px] max-[900px]:hidden dark:border-[#1c4068]">Ctrl K</kbd>
          </button>
          {/* Só os módulos que o perfil pode ver */}
          {busca !== 'fechada' && (
            <CommandPalette
              fechando={busca === 'fechando'}
              onClose={fecharBusca}
              onFechado={buscaFechada}
              items={visibleSections.flatMap(s => s.items.map(i => ({ ...i, grupo: s.title })))}
            />
          )}
          </div>

          {/* 4. Alternar tema */}
          <button type="button" onClick={alternarTema} title={tema === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'} aria-label="Alternar tema" className={headerIconButton}>
            {tema === 'escuro' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* 5. Notificações (o usuário logado fica só na sidebar) */}
          <NotificationsMenu />
        </header>

        {/* PAGE CONTENT */}
        <div className="px-4 md:px-8 pb-6 pt-4">
          {children}
        </div>
      </main>
    </div>
  )
}
