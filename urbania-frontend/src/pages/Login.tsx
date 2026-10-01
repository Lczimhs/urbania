import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Building2, CalendarCheck, Eye, EyeOff, FlaskConical, Handshake, Loader2, Lock, Mail, UserRound, Wallet,
} from 'lucide-react';
import { MODO_TESTE, useAuth } from '../lib/auth';
import logoImg from '../assets/logo.png';

const destaques = [
  { icon: <Building2 size={18} />, titulo: 'Imóveis e proprietários', texto: 'Portfólio com fotos, valores e vínculos.' },
  { icon: <CalendarCheck size={18} />, titulo: 'Visitas e negociações', texto: 'Da agenda do corretor à proposta aceita.' },
  { icon: <Wallet size={18} />, titulo: 'Financeiro e repasses', texto: 'Contratos, multas, despesas e pagamentos.' },
];

const acessosRapidos = [
  { label: 'Administrador', email: 'admin@urbania.com.br', senha: 'admin123', icon: <BadgeCheck size={16} /> },
  { label: 'Secretaria', email: 'fernanda@urbania.com.br', senha: 'sec123', icon: <Handshake size={16} /> },
  { label: 'Visitante', email: 'visitante@urbania.com.br', senha: 'visitante123', icon: <UserRound size={16} /> },
];

function Campo({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span>
      <span className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400 pointer-events-none">{icon}</span>
        {children}
      </span>
    </label>
  );
}

const inputClass =
  'w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [entrando, setEntrando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const entrar = async (emailLogin: string, senhaLogin: string, origem: string) => {
    setErro(null);
    setEntrando(origem);
    const res = await login(emailLogin, senhaLogin);
    setEntrando(null);
    if (res.success) navigate('/', { replace: true });
    else setErro(res.error || 'Não foi possível entrar. Verifique seus dados.');
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    // Protótipo: e-mail de funcionário entra com o perfil dele; qualquer outro (ou vazio) entra como Visitante
    entrar(email, senha, 'form');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* PAINEL DA MARCA (telas grandes) */}
      <aside className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#06182c] text-white p-12 flex-col justify-between">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-teal-500/25 blur-3xl" />
        <div className="absolute -bottom-40 right-0 w-[32rem] h-[32rem] rounded-full bg-sky-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }}
        />

        <div className="relative flex items-center gap-3">
          <img src={logoImg} alt="Urbânia" className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/20" />
          <div>
            <p className="font-bold text-lg leading-tight">Urbânia</p>
            <p className="text-xs text-teal-200/80 tracking-wide">Gestão Imobiliária Inteligente</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Do primeiro contato ao <span className="bg-gradient-to-r from-teal-300 to-sky-400 bg-clip-text text-transparent">repasse ao proprietário.</span>
          </h1>
          <p className="mt-5 text-slate-300 text-lg">Tudo o que a imobiliária precisa para vender, alugar e administrar imóveis em um só lugar.</p>

          <ul className="mt-10 space-y-3">
            {destaques.map(d => (
              <li key={d.titulo} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm">
                <span className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white">{d.icon}</span>
                <span>
                  <span className="block font-semibold">{d.titulo}</span>
                  <span className="block text-sm text-slate-400">{d.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">IFRO Campus Ji-Paraná · Equipe FrontDev's · 2026</p>
      </aside>

      {/* FORMULÁRIO */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={logoImg} alt="Urbânia" className="w-24 h-24 rounded-2xl shadow-sm" />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bem-vindo de volta</h2>
          <p className="mt-2 text-slate-500">Entre para acessar o painel da imobiliária.</p>

          {MODO_TESTE && (
            <div className="mt-6 flex gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900">
              <FlaskConical size={20} className="shrink-0 text-teal-600 mt-0.5" />
              <p className="text-sm"><strong>Ambiente de testes:</strong> use o e-mail de um funcionário para entrar com o perfil dele (qualquer senha). Outro e-mail, ou nenhum, entra como Visitante.</p>
            </div>
          )}

          {erro && <p role="alert" className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{erro}</p>}

          <form onSubmit={enviar} className="mt-6 space-y-5">
            <Campo label="E-mail" icon={<Mail size={18} />}>
              <input type="email" autoComplete="email" className={inputClass} placeholder="voce@urbania.com.br" value={email} onChange={e => setEmail(e.target.value)} />
            </Campo>

            <Campo label="Senha" icon={<Lock size={18} />}>
              <input type={verSenha ? 'text' : 'password'} autoComplete="current-password" className={`${inputClass} pr-12`} placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} />
              <button type="button" onClick={() => setVerSenha(!verSenha)} title={verSenha ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Campo>

            <button type="submit" disabled={!!entrando} className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-sky-600 shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-70">
              {entrando === 'form' ? <Loader2 size={18} className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
            </button>
          </form>

          {MODO_TESTE && (
            <>
              <div className="flex items-center gap-3 my-7 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> Acesso rápido <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {acessosRapidos.map(a => (
                  <button key={a.label} type="button" disabled={!!entrando} onClick={() => entrar(a.email, a.senha, a.label)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/50 transition disabled:opacity-60">
                    <span className="text-teal-600">{entrando === a.label ? <Loader2 size={16} className="animate-spin" /> : a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="mt-10 text-center text-xs text-slate-400">© 2026 Urbânia · Sistema de Gestão Imobiliária</p>
        </div>
      </main>
    </div>
  );
}
