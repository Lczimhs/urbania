import { useNavigate } from 'react-router-dom';
import { BadgeCheck, FlaskConical, LogOut, Mail, Pencil, Phone } from 'lucide-react';
import { useAuth, MODO_TESTE } from '../lib/auth';
import { useRecord } from '../lib/useApi';

// Meu Perfil: dados do usuário logado
export default function Perfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Usuários de teste (id 0) não existem na tabela de funcionários
  const { record: funcionario } = useRecord('funcionarios', user?.id ? String(user.id) : undefined);

  const nome = user?.nome || 'Usuário';
  const iniciais = nome.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const linhas = [
    { icon: <Mail size={16} />, label: 'E-mail', valor: user?.email },
    { icon: <BadgeCheck size={16} />, label: 'Cargo', valor: user?.cargo },
    { icon: <Phone size={16} />, label: 'Telefone', valor: funcionario?.telefone || user?.telefone },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#0a2540] via-sky-800 to-teal-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            {funcionario?.foto
              ? <img src={funcionario.foto} alt={nome} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow" />
              : <div className="w-20 h-20 rounded-2xl bg-teal-600 ring-4 ring-white shadow flex items-center justify-center text-white text-2xl font-bold">{iniciais}</div>}
            <div className="pb-1 min-w-0">
              <p className="text-xl font-bold text-slate-800 truncate">{nome}</p>
              <p className="text-sm text-teal-600 font-medium">{user?.cargo}</p>
            </div>
          </div>

          <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
            {linhas.map(l => (
              <div key={l.label} className="flex items-center gap-3 py-3">
                <span className="text-slate-400">{l.icon}</span>
                <dt className="w-24 text-sm text-slate-500">{l.label}</dt>
                <dd className="text-sm font-medium text-slate-800 truncate">{l.valor || <span className="text-slate-300">—</span>}</dd>
              </div>
            ))}
          </dl>

          {!funcionario && MODO_TESTE && (
            <p className="mt-4 flex gap-2 p-3 rounded-xl bg-teal-50 border border-teal-200 text-sm text-teal-900">
              <FlaskConical size={18} className="shrink-0 text-teal-600" />
              Você entrou com um usuário de teste. Para ter dados completos, cadastre-se em Funcionários e entre com esse e-mail.
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            {funcionario ? (
              <button onClick={() => navigate(`/funcionarios/${funcionario.id}/editar`)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0a2540] text-white font-semibold hover:bg-[#06182c]">
                <Pencil size={16} /> Editar meus dados
              </button>
            ) : <span />}
            <button onClick={() => { logout(); navigate('/login', { replace: true }); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50">
              <LogOut size={16} /> Sair do sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
