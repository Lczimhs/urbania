import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Building2, CalendarCheck, Eye, EyeOff, Loader2, Lock, Mail, Wallet,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import logoImg from '../assets/logo.png';

const destaques = [
  { icon: <Building2 size={18} />, titulo: 'Imóveis e proprietários', texto: 'Portfólio com fotos, valores e vínculos.' },
  { icon: <CalendarCheck size={18} />, titulo: 'Visitas e negociações', texto: 'Da agenda do corretor à proposta aceita.' },
  { icon: <Wallet size={18} />, titulo: 'Financeiro e repasses', texto: 'Contratos, multas, despesas e pagamentos.' },
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
  'w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-600/15';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEntrando(true);
    // Protótipo: e-mail de funcionário entra com o perfil dele; qualquer outro (ou vazio) entra como Visitante
    const res = await login(email, senha);
    setEntrando(false);
    if (res.success) navigate('/', { replace: true });
    else setErro(res.error || 'Não foi possível entrar. Verifique seus dados.');
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* PAINEL DA MARCA (telas grandes) */}
      <aside className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#06182c] text-white p-12 flex-col justify-between">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute -bottom-40 right-0 w-[32rem] h-[32rem] rounded-full bg-blue-600/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }}
        />

        <div className="relative flex items-center gap-3">
          <img src={logoImg} alt="Urbânia" className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/20" />
          <div>
            <p className="font-bold text-lg leading-tight">Urbânia</p>
            <p className="text-xs text-sky-200/80 tracking-wide">Gestão Imobiliária Inteligente</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Do primeiro contato ao <span className="text-sky-300">repasse ao proprietário.</span>
          </h1>
          <p className="mt-5 text-slate-300 text-lg">Tudo o que a imobiliária precisa para vender, alugar e administrar imóveis em um só lugar.</p>

          <ul className="mt-10 space-y-3">
            {destaques.map(d => (
              <li key={d.titulo} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm">
                <span className="w-9 h-9 shrink-0 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center">{d.icon}</span>
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
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          <img src={logoImg} alt="Urbânia" className="lg:hidden w-20 h-20 mx-auto mb-10 rounded-2xl object-cover ring-1 ring-slate-200" />

          <h2 className="text-3xl font-bold text-cadastro tracking-tight">Bem-vindo de volta</h2>
          <p className="mt-2 text-slate-500">Entre com seu e-mail e senha para continuar.</p>

          {erro && <p role="alert" className="mt-6 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{erro}</p>}

          <form onSubmit={enviar} className="mt-8 space-y-5">
            <Campo label="E-mail" icon={<Mail size={18} />}>
              <input type="email" autoComplete="email" className={inputClass} placeholder="voce@urbania.com.br" value={email} onChange={e => setEmail(e.target.value)} />
            </Campo>

            <Campo label="Senha" icon={<Lock size={18} />}>
              <input type={verSenha ? 'text' : 'password'} autoComplete="current-password" className={`${inputClass} pr-12`} placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} />
              <button type="button" onClick={() => setVerSenha(!verSenha)} title={verSenha ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Campo>

            <button type="submit" disabled={entrando} className="w-full h-12 mt-2 rounded-xl font-semibold text-white bg-cadastro hover:bg-cadastro-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-600/30 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {entrando ? <Loader2 size={18} className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-12 text-center text-xs text-slate-400">© 2026 Urbânia · Sistema de Gestão Imobiliária</p>
        </div>
      </main>
    </div>
  );
}
