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
  ClipboardList,
  DollarSign,
  FileText,
  Handshake,
  HardHat,
  Home,
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

const mainModules = [
  { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
  { path: '/clientes', label: 'Clientes', icon: <Users size={20} /> },
  { path: '/proprietarios', label: 'Proprietários', icon: <UserSquare2 size={20} /> },
  { path: '/imoveis', label: 'Imóveis', icon: <Building2 size={20} /> },
  { path: '/visitas', label: 'Visitas', icon: <Calendar size={20} /> },
  { path: '/negociacoes', label: 'Negociações', icon: <Handshake size={20} /> },
  { path: '/contratos', label: 'Contratos', icon: <FileText size={20} /> },
  { path: '/multas', label: 'Multas', icon: <AlertTriangle size={20} /> },
  { path: '/financeiro', label: 'Financeiro', icon: <DollarSign size={20} /> },
  { path: '/despesas', label: 'Despesas', icon: <Receipt size={20} /> },
  { path: '/relatorios', label: 'Relatórios', icon: <BarChart3 size={20} /> },
  { path: '/notificacoes', label: 'Notificações', icon: <Bell size={20} /> },
  { path: '/funcionarios', label: 'Funcionários', icon: <BadgeCheck size={20} /> },
  { path: '/perfis', label: 'Perfis de Acesso', icon: <ShieldCheck size={20} /> },
];

// Módulo ativo também nas subpáginas (ex.: /clientes/3/editar)
const isActive = (path: string, current: string) => (path === '/' ? current === '/' : current === path || current.startsWith(path + '/'));

const maintenanceModules = [
  { path: '/servicos', label: 'Serviços', icon: <ClipboardList size={20} /> },
  { path: '/prestadores', label: 'Prestadores', icon: <HardHat size={20} /> },
  { path: '/reparos', label: 'Reparos', icon: <Wrench size={20} /> },
  { path: '/canais', label: 'Canais de Publicação', icon: <Radio size={20} /> },
  { path: '/anuncios', label: 'Anúncios', icon: <Megaphone size={20} /> },
];

const systemModules = [
  { path: '/configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
];

export default function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const currentModule = [...mainModules, ...maintenanceModules, ...systemModules].find(x => isActive(x.path, loc.pathname));
  const [menuOpen, setMenuOpen] = useState(false);

  // No celular o menu fecha sozinho ao trocar de página
  useEffect(() => setMenuOpen(false), [loc.pathname]);

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
  
  return (
    <div className="flex h-screen bg-[#F0F4F8] font-sans text-slate-800">
      
      {/* SIDEBAR (gaveta no celular, fixa a partir de telas médias) */}
      {menuOpen && <div className="fixed inset-0 bg-slate-900/40 z-30 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-[#0a2540] text-slate-300 flex flex-col justify-between overflow-y-auto transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xl`}>
        <div>
          {/* Logo Urbânia Oficial */}
          <div className="p-3.5 mx-3 my-3 bg-[#06182c]/90 border border-slate-700/60 rounded-2xl flex items-center gap-3 shadow-inner">
            <div className="bg-white p-1 rounded-xl shadow flex items-center justify-center shrink-0">
              <img src={config.logo || logoImg} alt={`${config.nomeFantasia || 'Urbânia'} Logotipo`} className="h-10 w-10 object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-extrabold text-base tracking-wide leading-tight truncate">{config.nomeFantasia || 'Urbânia'}</span>
              <span className="text-[10px] text-teal-400 font-bold tracking-wider uppercase truncate">Imobiliária</span>
            </div>
          </div>

          {/* Módulos */}
          <div className="px-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Módulos</p>
            <nav className="space-y-1">
              {mainModules.map(item => {
                const active = isActive(item.path, loc.pathname);
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-sky-600 text-white shadow-md' : 'hover:bg-white/10 hover:text-white'}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Manutenção e Divulgação */}
          <div className="px-4 mt-8">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Manutenção e Divulgação</p>
            <nav className="space-y-1">
              {maintenanceModules.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path, loc.pathname) ? 'bg-sky-600 text-white shadow-md' : 'hover:bg-white/10 hover:text-white'}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Sistema */}
          <div className="px-4 mt-8">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Sistema</p>
            <nav className="space-y-1">
              {systemModules.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path, loc.pathname) ? 'bg-sky-600 text-white shadow-md' : 'hover:bg-white/10 hover:text-white'}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* User Badge Bottom com Identificação e Botão Sair */}
        <div className="p-3 m-3 bg-[#06182c] border border-slate-700/60 rounded-xl flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-bold leading-tight truncate">{user?.nome || 'Imobiliária'}</p>
              <p className="text-teal-400 text-[11px] font-medium truncate">{user?.cargo || 'Administrador'}</p>
            </div>
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
            <span className="font-semibold text-slate-900">Urbânia</span>
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
