import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalClientes: 14, totalImoveis: 9, receitaMes: 9220000, totalProprietarios: 8 });

  // Uncomment to fetch real stats when ready
  // useEffect(() => {
  //   api.get('/dashboard').then(r => setStats(r.data)).catch(console.error);
  // }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Bom dia, Carlos Mendes!</h1>
        <p className="text-slate-500 mt-1">Aqui está um resumo do sistema Urbânia.</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition cursor-pointer">
          <div className="w-3 h-3 rounded-full bg-sky-600 mb-4"></div>
          <p className="text-4xl font-bold text-sky-900">{stats.totalClientes}</p>
          <p className="text-sm font-bold text-slate-700 mt-1">Clientes</p>
          <p className="text-xs text-slate-400 mt-1">12 PF - 2 PJ</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition cursor-pointer">
          <div className="w-3 h-3 rounded-full bg-sky-500 mb-4"></div>
          <p className="text-4xl font-bold text-sky-900">{stats.totalProprietarios}</p>
          <p className="text-sm font-bold text-slate-700 mt-1">Proprietários</p>
          <p className="text-xs text-slate-400 mt-1">3 pessoas jurídicas</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition cursor-pointer">
          <div className="w-3 h-3 rounded-full bg-teal-500 mb-4"></div>
          <p className="text-4xl font-bold text-sky-900">{stats.totalImoveis}</p>
          <p className="text-sm font-bold text-slate-700 mt-1">Imóveis</p>
          <p className="text-xs text-slate-400 mt-1">6 à venda - 3 p/ locação</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm hover:shadow-md transition cursor-pointer ring-1 ring-sky-50">
          <div className="w-3 h-3 rounded-full bg-indigo-500 mb-4"></div>
          <p className="text-3xl font-bold text-indigo-600">R$ {stats.receitaMes.toLocaleString('pt-BR')}</p>
          <p className="text-sm font-bold text-slate-700 mt-1">Portfolio Total</p>
          <p className="text-xs text-slate-400 mt-1">Imóveis disponíveis para venda</p>
        </div>
      </div>

      {/* RECENT PROPERTIES */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Imóveis Recentes</h2>
          <Link to="/imoveis" className="text-sm text-sky-600 font-medium hover:underline">Ver todos →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          <div className="group cursor-pointer hover:bg-slate-50 transition">
            <div className="h-40 overflow-hidden bg-slate-100">
              <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Casa" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-800 text-sm">Apartamento Moderno em Pinheiros</h3>
              <p className="text-xs text-slate-500 mt-1">Pinheiros</p>
              <p className="text-sm font-bold text-teal-600 mt-2">R$ 750.000,00</p>
            </div>
          </div>

          <div className="group cursor-pointer hover:bg-slate-50 transition">
            <div className="h-40 overflow-hidden bg-slate-100">
              <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Casa" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-800 text-sm">Casa de Alto Padrão nos Jardins</h3>
              <p className="text-xs text-slate-500 mt-1">Jardins</p>
              <p className="text-sm font-bold text-teal-600 mt-2">R$ 1.200.000,00</p>
            </div>
          </div>

          <div className="group cursor-pointer hover:bg-slate-50 transition">
            <div className="h-40 overflow-hidden bg-slate-100">
              <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Casa" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-800 text-sm">Cobertura Duplex no Itaim Bibi</h3>
              <p className="text-xs text-slate-500 mt-1">Itaim Bibi</p>
              <p className="text-sm font-bold text-sky-600 mt-2">R$ 4.500,00/mês</p>
            </div>
          </div>

        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/clientes" className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-sky-200 transition flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition">
            <Plus size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 group-hover:text-sky-700 transition">Cadastrar novo cliente</p>
            <p className="text-xs text-slate-500">Adicionar ao CRM</p>
          </div>
        </Link>
        <Link to="/proprietarios" className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-sky-200 transition flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition">
            <Plus size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 group-hover:text-sky-700 transition">Cadastrar proprietário</p>
            <p className="text-xs text-slate-500">Vincular imóveis</p>
          </div>
        </Link>
        <Link to="/imoveis" className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-sky-200 transition flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition">
            <Plus size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 group-hover:text-sky-700 transition">Adicionar imóvel</p>
            <p className="text-xs text-slate-500">Publicar anúncio</p>
          </div>
        </Link>
      </div>

    </div>
  )
}
