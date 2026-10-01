import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isBlockedBroker, setIsBlockedBroker] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Se já estiver logado, redireciona para o Dashboard
  useState(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setErrorMsg('Por favor, informe seu e-mail e senha institucional.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setIsBlockedBroker(false);

    try {
      const res = await login(email, senha);
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setErrorMsg(res.error || 'Falha no login. Verifique seus dados.');
        if (res.bloqueado) {
          setIsBlockedBroker(true);
        }
      }
    } catch {
      setErrorMsg('Erro de comunicação com o servidor da imobiliária.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setSenha(fillPass);
    setErrorMsg(null);
    setIsBlockedBroker(false);
  };

  return (
    <div className="min-h-screen bg-[#071b2f] flex flex-col justify-center relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Background Glows & Geometry */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* LADO ESQUERDO: Apresentação da Marca & Regra de Acesso Exclusivo */}
          <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between bg-gradient-to-br from-[#0c2540] via-[#091f35] to-[#061625] border-b lg:border-b-0 lg:border-r border-slate-800 text-white relative">
            
            {/* Top Brand Header */}
            <div>
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide uppercase mb-6">
                <ShieldCheck size={14} className="text-teal-400" />
                Painel Corporativo Exclusivo
              </div>

              {/* Logo Card */}
              <div className="bg-white p-5 rounded-2xl shadow-lg shadow-black/20 w-fit mb-6 border border-slate-200">
                <img 
                  src={logoImg} 
                  alt="Urbânia - Gestão Imobiliária Inteligente" 
                  className="h-20 w-auto object-contain"
                />
              </div>

              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white mb-3">
                Sistema Integrado de Gestão Imobiliária
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Ambiente administrativo seguro para controle de contratos, carteira de locação, vistorias, financeiro, repasses de proprietários e operações da imobiliária.
              </p>

              {/* Destaque da Regra do Negócio */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs leading-relaxed space-y-2 mb-6">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                  Política de Controle de Acesso
                </div>
                <p>
                  <strong>Atenção:</strong> Por determinação da diretoria, <span className="underline decoration-amber-400 font-semibold text-white">os corretores de imóveis NÃO possuem acesso a este sistema</span>. O painel é de uso restrito da equipe interna da <strong>Imobiliária</strong> (Administração, Gestão Financeira e Secretaria).
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-2.5">
                {[
                  'Gestão Financeira com Conciliação e Repasse a Proprietários',
                  'Controle Jurídico de Contratos de Locação e Venda',
                  'Ordens de Reparo, Prestadores e Manutenção Predial',
                  'Auditoria Completa de Acessos e Operações em Tempo Real'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={15} className="text-teal-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-8 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Urbânia Gestão Imobiliária Inteligente</span>
              <span>Versão 2026.1 Enterprise</span>
            </div>
          </div>

          {/* LADO DIREITO: Formulário de Autenticação */}
          <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between bg-slate-900/90">
            <div>
              {/* Form Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Building2 size={24} className="text-sky-400" />
                  Entrar no Sistema
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Digite seu e-mail institucional e senha para continuar.
                </p>
              </div>

              {/* ALERTA DE BLOQUEIO DE CORRETOR */}
              {isBlockedBroker && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400 shrink-0 mt-0.5">
                      <ShieldAlert size={20} />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="text-sm font-bold text-red-300">Acesso Negado (Corretor)</p>
                      <p className="leading-relaxed">
                        Corretores de imóveis <strong>não possuem acesso</strong> a esta plataforma administrativa. O uso é restrito aos colaboradores da imobiliária.
                      </p>
                      <p className="text-[11px] text-red-300/80 pt-1">
                        Para suporte ou envio de relatórios de visitação, contate a secretaria da imobiliária.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Erro padrão caso não seja bloqueio de corretor */}
              {!isBlockedBroker && errorMsg && (
                <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
                  <AlertTriangle size={18} className="text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    E-mail Institucional
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@urbania.com.br"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      className="text-xs text-sky-400 hover:text-sky-300 transition"
                      onClick={() => alert('Para redefinição de senha, solicite ao setor de TI ou Diretoria da Urbânia.')}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-12 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-400 focus:ring-offset-slate-900"
                    />
                    Lembrar minhas credenciais
                  </label>
                  <span className="text-[11px] text-teal-400/80 font-medium">Ambiente Seguro SSL</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Autenticando na Imobiliária...</span>
                    </>
                  ) : (
                    <>
                      <span>Acessar Painel Urbânia</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* SEÇÃO DE TESTE RÁPIDO (DEMONSTRAÇÃO DE ACESSO E BLOQUEIO DE CORRETOR) */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Credenciais Rápidas de Teste:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@urbania.com.br', 'admin123')}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>👑 Admin</span>
                    <span className="text-[10px] text-teal-400 font-normal">Acesso Total</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">admin@urbania.com.br</p>
                </button>

                {/* Secretaria */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('fernanda@urbania.com.br', 'sec123')}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>📋 Secretaria</span>
                    <span className="text-[10px] text-teal-400 font-normal">Imobiliária</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">fernanda@urbania.com.br</p>
                </button>

                {/* Corretor - Testar Bloqueio */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('carlos.mendes@urbania.com.br', 'corretor123')}
                  className="p-2.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/50 rounded-lg text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                    <span>🚫 Corretor</span>
                    <span className="text-[10px] text-rose-400 font-normal">Bloqueado</span>
                  </div>
                  <p className="text-[10px] text-rose-400/80 mt-0.5 truncate">carlos.mendes@...</p>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
