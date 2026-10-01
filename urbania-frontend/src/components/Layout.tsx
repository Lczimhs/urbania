import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, UserSquare2, Building2, Calendar, BadgeCheck, Handshake, FileText, DollarSign, BarChart3, Settings, Bell, ChevronDown, Menu, ClipboardList, HardHat, Wrench, Radio, Megaphone } from 'lucide-react';

const mainModules = [
  { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
  { path: '/clientes', label: 'Clientes', icon: <Users size={20} /> },
  { path: '/proprietarios', label: 'Proprietários', icon: <UserSquare2 size={20} /> },
  { path: '/imoveis', label: 'Imóveis', icon: <Building2 size={20} /> },
  { path: '/visitas', label: 'Visitas', icon: <Calendar size={20} /> },
  { path: '/negociacoes', label: 'Negociações', icon: <Handshake size={20} /> },
  { path: '/funcionarios', label: 'Funcionários', icon: <BadgeCheck size={20} /> },
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

const upcomingModules = [
  { label: 'Contratos', icon: <FileText size={20} /> },
  { label: 'Financeiro', icon: <DollarSign size={20} /> },
  { label: 'Relatórios', icon: <BarChart3 size={20} /> },
  { label: 'Configurações', icon: <Settings size={20} /> },
];

export default function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const currentModule = [...mainModules, ...maintenanceModules].find(x => isActive(x.path, loc.pathname));
  const [menuOpen, setMenuOpen] = useState(false);

  // No celular o menu fecha sozinho ao trocar de página
  useEffect(() => setMenuOpen(false), [loc.pathname]);
  
  return (
    <div className="flex h-screen bg-[#F0F4F8] font-sans text-slate-800">
      
      {/* SIDEBAR (gaveta no celular, fixa a partir de telas médias) */}
      {menuOpen && <div className="fixed inset-0 bg-slate-900/40 z-30 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-[#0a2540] text-slate-300 flex flex-col justify-between overflow-y-auto transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 text-white font-bold text-xl tracking-wide mb-4">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            Urbânia
          </div>

          {/* Módulos */}
          <div className="px-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Módulos</p>
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
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Manutenção e Divulgação</p>
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

          {/* Em Breve */}
          <div className="px-4 mt-8">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Em Breve</p>
            <nav className="space-y-1">
              {upcomingModules.map(item => (
                <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500/50 cursor-not-allowed">
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* User Badge Bottom */}
        <div className="p-4 m-4 bg-[#06182c] rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
            CM
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">Carlos Mendes</p>
            <p className="text-sky-400 text-xs">Corretor</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white flex items-center justify-between px-4 md:px-8 shadow-sm z-10">
          <div className="text-sky-600 font-medium text-sm flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="md:hidden p-1 -ml-1 text-slate-600" title="Menu"><Menu size={24} /></button>
            Urbânia {currentModule && currentModule.path !== '/' ? ` / ${currentModule.label}` : ''}
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-sky-600 transition">
              <Bell size={22} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="hidden sm:flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-[#0a2540] flex items-center justify-center text-white font-bold text-sm">
                CM
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 leading-tight">Carlos Mendes</span>
                <span className="text-xs text-slate-500">Corretor Sênior</span>
              </div>
              <ChevronDown size={16} className="text-slate-400 ml-2" />
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
