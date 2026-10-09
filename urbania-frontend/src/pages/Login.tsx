import { useEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { initDeviceInfo } from '../api';
import logoImg from '../assets/logo.png';
import './Login.css';

// ===== Vitrine 3D (decorativa) =====
const KINDS = ['Apartamento', 'Casa térrea', 'Sobrado', 'Sala comercial', 'Terreno', 'Cobertura'] as const;
type Kind = typeof KINDS[number];
const TAGS = [
  { label: 'Venda', cls: 'lg-pill-venda' },
  { label: 'Locação', cls: 'lg-pill-locacao' },
  { label: 'Administração', cls: 'lg-pill-admin' },
];
const SKIES = [['#0e3a6b', '#081f3d'], ['#1e3a8a', '#0b2545'], ['#0c4a6e', '#082f49'], ['#172554', '#0a1b3a']];
// 14 colunas (o padrão de deslocamento se repete) para cobrir também monitores largos
const COL_PADDING = Array.from({ length: 14 }, (_, i) => [0, 140, 60, 0, 180, 40][i % 6]);
const CARDS_PER_COL = 7;

// Janela acesa; o atraso varia para as janelas não piscarem todas juntas
const Win = ({ x, y, w = 7, h = 8, d = 0 }: { x: number; y: number; w?: number; h?: number; d?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={1} className="lg-win" style={{ animationDelay: `${d}s` }} />
);

// Ilustrações em traço ciano (viewBox 230×138, chão em y=118)
function Illustration({ kind, seed }: { kind: Kind; seed: number }) {
  const d = (n: number) => ((seed * 7 + n * 3) % 10) * 0.5;
  switch (kind) {
    case 'Apartamento':
      return (
        <g>
          <rect x={78} y={34} width={46} height={84} />
          <rect x={124} y={68} width={34} height={50} />
          {[44, 60, 76, 92].map((y, r) => [86, 100].map((x, c) => <Win key={`${r}${c}`} x={x} y={y} d={d(r + c)} />))}
          <Win x={133} y={78} d={d(9)} /><Win x={133} y={94} d={d(4)} />
        </g>
      );
    case 'Casa térrea':
      return (
        <g>
          <polyline points="66,84 115,50 164,84" />
          <rect x={74} y={82} width={82} height={36} />
          <rect x={108} y={96} width={14} height={22} fill="#fbbf24" stroke="none" />
          <Win x={84} y={92} w={12} h={10} d={d(1)} /><Win x={134} y={92} w={12} h={10} d={d(2)} />
        </g>
      );
    case 'Sobrado':
      return (
        <g>
          <polyline points="72,58 115,28 158,58" />
          <rect x={80} y={56} width={70} height={62} />
          <line x1={80} y1={86} x2={150} y2={86} />
          <Win x={90} y={64} w={12} h={11} d={d(1)} /><Win x={128} y={64} w={12} h={11} d={d(2)} />
          <Win x={90} y={95} w={12} h={11} d={d(3)} />
          <rect x={124} y={96} width={14} height={22} fill="#fbbf24" stroke="none" />
        </g>
      );
    case 'Sala comercial':
      return (
        <g>
          <rect x={52} y={46} width={126} height={72} />
          {[56, 72, 88].map(y => <rect key={y} x={60} y={y} width={110} height={9} fill="rgba(125,211,252,.18)" />)}
          <Win x={70} y={57} w={20} h={7} d={d(1)} /><Win x={130} y={73} w={20} h={7} d={d(2)} />
          <rect x={106} y={102} width={18} height={16} />
        </g>
      );
    case 'Terreno':
      return (
        <g>
          <polygon points="50,118 92,92 180,92 160,118" strokeDasharray="5 4" />
          <line x1={120} y1={104} x2={120} y2={66} />
          <polygon points="120,66 142,72 120,78" fill="#fbbf24" stroke="none" />
          <line x1={74} y1={118} x2={74} y2={94} />
          <circle cx={74} cy={84} r={12} />
        </g>
      );
    case 'Cobertura':
      return (
        <g>
          <rect x={94} y={22} width={38} height={16} />
          <line x1={76} y1={38} x2={150} y2={38} />
          {[80, 90, 136, 146].map(x => <line key={x} x1={x} y1={38} x2={x} y2={31} />)}
          <line x1={76} y1={31} x2={150} y2={31} />
          <rect x={82} y={38} width={62} height={80} />
          <Win x={104} y={27} w={18} h={7} d={d(5)} />
          {[48, 64, 80, 96].map((y, r) => [92, 108, 124].map((x, c) => <Win key={`${r}${c}`} x={x} y={y} d={d(r * 3 + c)} />))}
        </g>
      );
  }
}

function AdCard({ col, i }: { col: number; i: number }) {
  const kind = KINDS[(i * 2 + col) % 6];
  const tag = kind === 'Terreno' ? TAGS[0] : TAGS[(i + col * 2) % 3];
  const [skyTop, skyBottom] = SKIES[(i + col) % 4];
  return (
    <div className="lg-ad">
      <div className="lg-ad-top" style={{ background: `linear-gradient(180deg, ${skyTop}, ${skyBottom})` }}>
        <span className={`lg-pill ${tag.cls}`}>{tag.label}</span>
        <svg viewBox="0 0 230 138" preserveAspectRatio="xMidYMax meet">
          <circle cx={192} cy={30} r={11} fill="#e0f2fe" opacity={.85} />
          <line x1={12} y1={118} x2={218} y2={118} stroke="rgba(125,211,252,.45)" strokeWidth={1.5} />
          <g fill="none" stroke="#7dd3fc" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
            <Illustration kind={kind} seed={col * 6 + i} />
          </g>
        </svg>
      </div>
      <div className="lg-ad-body">
        <p className="lg-ad-name">{kind}</p>
        <div className="lg-skel" style={{ width: '46%', background: 'rgba(125,211,252,.22)' }} />
        <div className="lg-skel" style={{ width: '34%', background: 'rgba(125,211,252,.14)' }} />
        <div className="lg-skel" style={{ width: '40%', background: 'rgba(125,211,252,.14)' }} />
      </div>
    </div>
  );
}

function Showcase() {
  return (
    <div className="lg-layer lg-showcase" aria-hidden="true">
      <div className="lg-wall-in">
        <div className="lg-wall">
          {COL_PADDING.map((pad, col) => (
            <div key={col} className="lg-col" style={{ paddingTop: pad }}>
              {/* 6 cards duplicados: o trilho anda 50% e recomeça sem salto */}
              <div className="lg-track">
                {Array.from({ length: CARDS_PER_COL * 2 }, (_, k) => <AdCard key={k} col={col} i={k % CARDS_PER_COL} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Chaveiro de imobiliária pendurado no card
function Keychain() {
  return (
    <div className="lg-keys" aria-hidden="true">
      <div className="lg-ring" />
      <div className="lg-swing-in">
        <div className="lg-swing-hover">
          <div className="lg-rod" />
          <div className="lg-tag">
            <span className="lg-tag-hole" />
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" />
            </svg>
            <span className="lg-tag-line" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, icon, children }: { id: string; label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="lg-label">{label}</label>
      <div className="lg-field">{icon}{children}</div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    initDeviceInfo().catch(() => {});
  }, []);

  // Parallax: grava --mx/--my no root via requestAnimationFrame, sem re-render do React
  const rootRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const parallaxOn = useRef(false);
  useEffect(() => {
    parallaxOn.current = !window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, []);

  const onMouseMove = (e: MouseEvent) => {
    if (!parallaxOn.current || frame.current !== null) return;
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const el = rootRef.current;
      if (!el) return;
      el.style.setProperty('--mx', (clientX / window.innerWidth - 0.5).toFixed(3));
      el.style.setProperty('--my', (clientY / window.innerHeight - 0.5).toFixed(3));
    });
  };

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
    <div ref={rootRef} className="lg-root" onMouseMove={onMouseMove}>
      <Showcase />
      <div className="lg-layer lg-shade-h" />
      <div className="lg-layer lg-shade-v" />
      <div className="lg-glow" aria-hidden="true" />

      <div className="lg-left">
        <div className="lg-brand">
          <div className="lg-logo"><img src={logoImg} alt="" /></div>
          <div>
            <p className="lg-brand-name">Urbânia</p>
            <p className="lg-brand-sub">Gestão Imobiliária Inteligente</p>
          </div>
        </div>
        <p className="lg-credit">IFRO Campus Ji-Paraná · Equipe FrontDev's · 2026</p>
      </div>

      <main className="lg-right">
        <div className="lg-cardwrap">
          <div className="lg-tilt">
            <div className="lg-floor" aria-hidden="true" />
            <Keychain />
            <div className="lg-card">
              <h1 className="lg-title">Bem-vindo de volta</h1>
              <p className="lg-subtitle">Entre com seu e-mail e senha para continuar.</p>


              {erro && <p role="alert" className="lg-error">{erro}</p>}

              <form onSubmit={enviar} className="lg-form">
                <Field id="login-email" label="E-mail" icon={<Mail size={20} aria-hidden="true" />}>
                  <input id="login-email" type="email" autoComplete="email" placeholder="voce@urbania.com.br" value={email} onChange={e => setEmail(e.target.value)} />
                </Field>

                <Field id="login-senha" label="Senha" icon={<Lock size={20} aria-hidden="true" />}>
                  <input id="login-senha" type={verSenha ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} />
                  <button type="button" className="lg-eye" onClick={() => setVerSenha(!verSenha)} aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                    {verSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </Field>

                <button type="submit" disabled={entrando} className="lg-btn">
                  {entrando
                    ? <Loader2 size={20} className="animate-spin" />
                    : <>Entrar <span className="lg-arrow"><ArrowRight size={20} /></span></>}
                </button>
              </form>

              <p className="lg-foot">© 2026 Urbânia · Sistema de Gestão Imobiliária</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
