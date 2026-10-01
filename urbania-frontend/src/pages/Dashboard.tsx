import { Link, useNavigate } from 'react-router-dom';
import { Building2, CalendarPlus, FileText, Handshake, Plus } from 'lucide-react';
import { useList } from '../lib/useApi';
import { formatCurrency, formatDate } from '../lib/format';
import { onlyDigits } from '../lib/masks';
import { parsePhotos } from '../lib/files';
import { precoImovel } from './Imoveis';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const clientes = useList('clientes');
  const proprietarios = useList('proprietarios');
  const imoveis = useList('imoveis');
  const visitas = useList('visitas');
  const negociacoes = useList('negociacoes');
  const contratos = useList('contratos');

  const loading = clientes.loading || proprietarios.loading || imoveis.loading || visitas.loading || negociacoes.loading || contratos.loading;
  const pf = clientes.rows.filter(c => onlyDigits(c.cpfCnpj).length !== 14).length;
  const pj = proprietarios.rows.filter(p => p.tipo === 'Jurídica').length;
  const aVenda = imoveis.rows.filter(i => i.finalidade === 'Venda' || i.finalidade === 'Venda e Aluguel');
  const paraLocacao = imoveis.rows.filter(i => i.finalidade !== 'Venda' && i.finalidade).length;
  const portfolio = aVenda.reduce((s, i) => s + Number(i.precoVenda || 0), 0);
  const pendentes = visitas.rows.filter(v => v.status === 'Pendente' || v.status === 'Confirmada');
  const emAndamentoNeg = negociacoes.rows.filter(n => n.status === 'Em Andamento');
  const contratosAtivos = contratos.rows.filter(c => c.status === 'Ativo');
  const recentes = [...imoveis.rows].sort((a, b) => b.id - a.id).slice(0, 3);
  const n = (v: number) => (loading ? '…' : v);

  const cards = [
    { label: 'Clientes', value: n(clientes.rows.length), hint: `${pf} PF - ${clientes.rows.length - pf} PJ`, color: 'bg-sky-600', to: '/clientes' },
    { label: 'Proprietários', value: n(proprietarios.rows.length), hint: `${pj} pessoa(s) jurídica(s)`, color: 'bg-sky-500', to: '/proprietarios' },
    { label: 'Imóveis', value: n(imoveis.rows.length), hint: `${aVenda.length} à venda - ${paraLocacao} p/ locação`, color: 'bg-teal-500', to: '/imoveis' },
    { label: 'Visitas agendadas', value: n(pendentes.length), hint: 'Pendentes ou confirmadas', color: 'bg-amber-500', to: '/visitas' },
    { label: 'Negociações ativas', value: n(emAndamentoNeg.length), hint: `${negociacoes.rows.length} registradas`, color: 'bg-indigo-600', to: '/negociacoes' },
    { label: 'Contratos ativos', value: n(contratosAtivos.length), hint: `${contratos.rows.length} registrados`, color: 'bg-emerald-600', to: '/contratos' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{greeting()}, Carlos Mendes!</h1>
        <p className="text-slate-500 mt-1">Aqui está um resumo do sistema Urbânia.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition">
            <div className={`w-3 h-3 rounded-full ${c.color} mb-4`}></div>
            <p className="text-4xl font-bold text-sky-900">{c.value}</p>
            <p className="text-sm font-bold text-slate-700 mt-1">{c.label}</p>
            <p className="text-xs text-slate-400 mt-1">{c.hint}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm">
        <p className="text-sm font-bold text-slate-700">Portfólio à venda</p>
        <p className="text-3xl font-bold text-indigo-600 mt-1">{loading ? '…' : formatCurrency(portfolio)}</p>
        <p className="text-xs text-slate-400 mt-1">Soma dos preços de venda dos imóveis disponíveis para venda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IMÓVEIS RECENTES */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Imóveis Recentes</h2>
            <Link to="/imoveis" className="text-sm text-sky-600 font-medium hover:underline">Ver todos →</Link>
          </div>
          {!recentes.length ? (
            <p className="p-8 text-center text-slate-400">{loading ? 'Carregando...' : 'Nenhum imóvel cadastrado ainda.'}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {recentes.map(i => {
                const foto = parsePhotos(i.fotos)[0];
                return (
                  <div key={i.id} onClick={() => navigate(`/imoveis/${i.id}`)} className="group cursor-pointer hover:bg-slate-50 transition">
                    <div className="h-36 overflow-hidden bg-slate-100">
                      {foto ? <img src={foto} alt={i.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300"><Building2 size={40} /></div>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-800 text-sm">{i.titulo}</h3>
                      <p className="text-xs text-slate-500 mt-1">{i.bairro || i.cidade}</p>
                      <p className="text-sm font-bold text-teal-600 mt-2">{precoImovel(i)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PRÓXIMAS VISITAS */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Próximas Visitas</h2>
            <Link to="/visitas" className="text-sm text-sky-600 font-medium hover:underline">Agenda →</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {[...pendentes].sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`)).slice(0, 5).map(v => (
              <li key={v.id} onClick={() => navigate(`/visitas/${v.id}`)} className="px-6 py-3 hover:bg-slate-50 cursor-pointer">
                <p className="text-sm font-semibold text-slate-800">{clientes.rows.find(c => c.id === v.clienteId)?.nome || v.clienteNome}</p>
                <p className="text-xs text-slate-500">{formatDate(v.data)} {v.hora} · {imoveis.rows.find(i => i.id === v.imovelId)?.titulo || v.imovelTitulo}</p>
              </li>
            ))}
            {!pendentes.length && <li className="px-6 py-8 text-center text-slate-400 text-sm">{loading ? 'Carregando...' : 'Nenhuma visita agendada.'}</li>}
          </ul>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { to: '/clientes/novo', title: 'Cadastrar cliente', hint: 'Adicionar ao CRM', icon: <Plus size={20} /> },
          { to: '/proprietarios/novo', title: 'Cadastrar proprietário', hint: 'Vincular imóveis', icon: <Plus size={20} /> },
          { to: '/imoveis/novo', title: 'Adicionar imóvel', hint: 'Com fotos e valores', icon: <Plus size={20} /> },
          { to: '/visitas/novo', title: 'Agendar visita', hint: 'Cliente + imóvel', icon: <CalendarPlus size={20} /> },
          { to: '/negociacoes/novo', title: 'Nova negociação', hint: 'Registrar proposta', icon: <Handshake size={20} /> },
          { to: '/contratos/novo', title: 'Novo contrato', hint: 'Locação ou venda', icon: <FileText size={20} /> },
        ].map(a => (
          <Link key={a.to} to={a.to} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-sky-200 transition flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition shrink-0">{a.icon}</div>
            <div>
              <p className="font-bold text-sm text-slate-800 group-hover:text-sky-700 transition leading-snug">{a.title}</p>
              <p className="text-xs text-slate-500">{a.hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
