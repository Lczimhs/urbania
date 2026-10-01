import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCheck, Settings2 } from 'lucide-react';
import { Card, PageHeader } from '../components/DataTable';
import { AlertaItem } from '../components/HeaderMenus';
import { useAlertas } from '../lib/alertas';
import { Pode } from '../lib/auth';
import type { Alerta } from '../lib/alertas';

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'nao-lidas', label: 'Não lidas' },
  { id: 'urgente', label: 'Urgentes' },
] as const;

// Todas as notificações geradas pelo sistema
export default function Avisos() {
  const navigate = useNavigate();
  const { alertas, loading, lidas, naoLidas, marcarLida, marcarTodas } = useAlertas();
  const [filtro, setFiltro] = useState<typeof FILTROS[number]['id']>('todas');

  const lista = alertas.filter(a =>
    filtro === 'nao-lidas' ? !lidas.includes(a.id) : filtro === 'urgente' ? a.tom === 'urgente' : true);

  const abrir = (a: Alerta) => { marcarLida(a.id); navigate(a.link); };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Notificações" subtitle={`${alertas.length} aviso(s) · ${naoLidas} não lido(s)`}
        action={
          <Pode acao="Visualizar" modulo="notificacoes"><Link to="/notificacoes" className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-lg font-semibold text-slate-700 hover:bg-slate-50">
            <Settings2 size={18} /> Gerenciar regras
          </Link></Pode>
        }
      />
      <Card>
        <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-2">
            {FILTROS.map(f => (
              <button key={f.id} onClick={() => setFiltro(f.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${filtro === f.id ? 'bg-[#0a2540] text-white border-[#0a2540]' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={marcarTodas} disabled={!naoLidas} className="text-sm font-semibold text-sky-600 disabled:text-slate-300 inline-flex items-center gap-1">
            <CheckCheck size={16} /> Marcar todas como lidas
          </button>
        </div>
        {loading && !alertas.length ? <p className="p-8 text-center text-slate-400">Carregando...</p>
          : !lista.length ? <p className="p-8 text-center text-slate-400">Nenhuma notificação neste filtro.</p>
          : lista.map(a => <AlertaItem key={a.id} alerta={a} lida={lidas.includes(a.id)} onOpen={abrir} />)}
      </Card>
    </div>
  );
}
