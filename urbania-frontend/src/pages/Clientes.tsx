import { useEffect, useState } from 'react';
import { api } from '../api';
import { Search, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Clientes() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);

  const load = () => {
    setLoading(true);
    api.get('/clientes').then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load() }, []);

  // MASCARAS DINAMICAS
  const maskPhone = (v: any) => {
    if (!v) return "";
    let str = String(v).replace(/\\D/g, "");
    if (str.length <= 2) return str;
    if (str.length <= 6) return str.replace(/(\\d{2})(\\d{1,})/, "($1) $2");
    if (str.length <= 10) return str.replace(/(\\d{2})(\\d{4})(\\d{1,})/, "($1) $2-$3");
    return str.replace(/(\\d{2})(\\d{5})(\\d{1,4}).*/, "($1) $2-$3");
  };

  const maskCpfCnpj = (v: any) => {
    if (!v) return "";
    let str = String(v).replace(/\\D/g, "");
    
    if (str.length <= 11) {
      if (str.length <= 3) return str;
      if (str.length <= 6) return str.replace(/(\\d{3})(\\d{1,})/, "$1.$2");
      if (str.length <= 9) return str.replace(/(\\d{3})(\\d{3})(\\d{1,})/, "$1.$2.$3");
      return str.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{1,2}).*/, "$1.$2.$3-$4");
    } else {
      if (str.length <= 12) return str.replace(/(\\d{2})(\\d{3})(\\d{3})(\\d{1,})/, "$1.$2.$3/$4");
      return str.replace(/(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{1,2}).*/, "$1.$2.$3/$4-$5");
    }
  };

  const maskRG = (v: any) => {
    if (!v) return "";
    let str = String(v).replace(/\\D/g, "");
    if (str.length <= 2) return str;
    if (str.length <= 5) return str.replace(/(\\d{2})(\\d{1,})/, "$1.$2");
    if (str.length <= 8) return str.replace(/(\\d{2})(\\d{3})(\\d{1,})/, "$1.$2.$3");
    return str.replace(/(\\d{2})(\\d{3})(\\d{3})(\\d{1}).*/, "$1.$2.$3-$4");
  };

  const maskCEP = (v: any) => {
    if (!v) return "";
    let str = String(v).replace(/\\D/g, "");
    if (str.length <= 2) return str;
    if (str.length <= 5) return str.replace(/(\\d{2})(\\d{1,})/, "$1.$2");
    return str.replace(/(\\d{2})(\\d{3})(\\d{1,3}).*/, "$1.$2-$3");
  };

  const maskCurrency = (v: any) => {
    if (v === null || v === undefined) return "";
    let str = String(v).replace(/\\D/g, "");
    if (str === "") return "";
    const num = (Number(str) / 100).toFixed(2);
    let formatted = num.replace(".", ",");
    formatted = formatted.replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1.");
    return "R$ " + formatted;
  };

  const save = async (e: any) => {
    e.preventDefault();
    
    // Validacao Obrigatória
    const required = ['nome', 'telefone', 'cpfCnpj', 'email', 'origem', 'tipo', 'rg', 'dataNascimento', 'sexo', 'estadoCivil', 'profissao', 'renda', 'logradouro', 'cidade', 'uf'];
    for (let f of required) {
      if (!form[f]) {
        alert("Por favor, preencha todos os campos obrigatórios (marcados com *). Campo vazio: " + f);
        return;
      }
    }
    
    try {
      let payload = { ...form };
      if (payload.renda && typeof payload.renda === 'string' && payload.renda.includes("R$")) payload.renda = Number(payload.renda.replace(/\\D/g, '')) / 100;
      if (payload.faixaMin && typeof payload.faixaMin === 'string' && payload.faixaMin.includes("R$")) payload.faixaMin = Number(payload.faixaMin.replace(/\\D/g, '')) / 100;
      if (payload.faixaMax && typeof payload.faixaMax === 'string' && payload.faixaMax.includes("R$")) payload.faixaMax = Number(payload.faixaMax.replace(/\\D/g, '')) / 100;

      if (form.id) {
        await api.put('/clientes/' + form.id, payload);
        alert("Cliente atualizado com sucesso!");
      } else {
        await api.post('/clientes', payload);
        alert("Cliente cadastrado com sucesso!");
      }
      
      setForm(null);
      load();
    } catch (err) {
      alert("Erro ao salvar cliente.");
    }
  };

  const remove = async (id: number) => {
    if(confirm('Tem certeza que deseja excluir este cliente?')) {
      await api.delete('/clientes/' + id);
      load();
    }
  };

  const filteredData = data.filter(c => 
    (c.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.telefone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">{data.length} cadastros</p>
        </div>
        <button onClick={() => { setForm({ tipo: 'Comprador', origem: 'Indicação' }); setActiveTab(0); }} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-[#06182c] transition outline-none">
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
        
        {/* TOOLBAR */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, email ou telefone..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select className="border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 bg-white outline-none">
              <option>Todos os tipos</option>
              <option>Comprador</option>
              <option>Locatário</option>
              <option>Interessado</option>
            </select>
            <select className="border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 bg-white outline-none">
              <option>Todas as origens</option>
              <option>Indicação</option>
              <option>Site</option>
              <option>Redes Sociais</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Carregando clientes...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum cliente encontrado.</td></tr>
              ) : (
                filteredData.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => { setForm(row); setActiveTab(0); }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          {getInitials(row.nome)}
                        </div>
                        <span className="font-semibold text-slate-800">{row.nome || 'Sem Nome'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sky-600">{row.email}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.telefone}</td>
                    <td className="px-6 py-4">
                      <span className={"px-2.5 py-1 rounded-full text-xs font-bold " + (row.tipo === 'Locatário' ? 'bg-amber-100 text-amber-700' : row.tipo === 'Interessado' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700')}>
                        {row.tipo || 'Comprador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{row.origem || 'Indicação'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-slate-400">
                        <button className="hover:text-sky-600 transition p-1 outline-none"><Eye size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setForm(row); setActiveTab(0); }} className="hover:text-amber-500 transition p-1 outline-none"><Edit2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); remove(row.id); }} className="hover:text-red-500 transition p-1 outline-none"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-white">
          <span>Mostrando 1-{Math.min(filteredData.length, 10)} de {filteredData.length}</span>
          <div className="flex items-center gap-2">
            <button className="p-1 text-slate-400 hover:text-slate-800 transition outline-none"><ChevronLeft size={20} /></button>
            <button className="w-7 h-7 rounded bg-[#0a2540] text-white font-bold flex items-center justify-center outline-none">1</button>
            <button className="w-7 h-7 rounded hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center transition outline-none">2</button>
            <button className="p-1 text-slate-400 hover:text-slate-800 transition outline-none"><ChevronRight size={20} /></button>
          </div>
        </div>

      </div>

      {/* MODAL OVERLAY PARA O FORMULÁRIO */}
      {form && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden outline-none">
            <div className="flex justify-between items-center p-6 border-b bg-white">
              <h2 className="text-xl font-bold text-slate-800">{form.id ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-700 outline-none"><X size={24} /></button>
            </div>
            
            {/* TABS */}
            <div className="flex border-b px-6 pt-4 gap-6 text-sm font-semibold text-slate-500 bg-white">
              <button onClick={() => setActiveTab(0)} className={"pb-3 border-b-2 transition-colors outline-none " + (activeTab === 0 ? 'border-[#0a2540] text-[#0a2540]' : 'border-transparent hover:text-slate-800')}>Dados Básicos</button>
              <button onClick={() => setActiveTab(1)} className={"pb-3 border-b-2 transition-colors outline-none " + (activeTab === 1 ? 'border-[#0a2540] text-[#0a2540]' : 'border-transparent hover:text-slate-800')}>Dados Pessoais</button>
              <button onClick={() => setActiveTab(2)} className={"pb-3 border-b-2 transition-colors outline-none " + (activeTab === 2 ? 'border-[#0a2540] text-[#0a2540]' : 'border-transparent hover:text-slate-800')}>Endereço</button>
              <button onClick={() => setActiveTab(3)} className={"pb-3 border-b-2 transition-colors outline-none " + (activeTab === 3 ? 'border-[#0a2540] text-[#0a2540]' : 'border-transparent hover:text-slate-800')}>Perfil de Busca</button>
            </div>

            <form onSubmit={save} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                
                {/* TAB 0: Dados Básicos */}
                {activeTab === 0 && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Completo *</label>
                      <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.nome || ''} onChange={e => setForm({...form, nome: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Telefone *</label>
                      <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.telefone || ''} onChange={e => setForm({...form, telefone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">E-mail *</label>
                      <input type="email" required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Origem *</label>
                      <select required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.origem || 'Indicação'} onChange={e => setForm({...form, origem: e.target.value})}>
                        <option value="Indicação">Indicação</option>
                        <option value="Site">Site</option>
                        <option value="Redes Sociais">Redes Sociais</option>
                        <option value="Telefone">Telefone</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Cliente *</label>
                      <select required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.tipo || 'Comprador'} onChange={e => setForm({...form, tipo: e.target.value})}>
                        <option value="Comprador">Comprador</option>
                        <option value="Locatário">Locatário</option>
                        <option value="Interessado">Interessado</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 1: Dados Pessoais */}
                {activeTab === 1 && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CPF/CNPJ *</label>
                      <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.cpfCnpj || ''} onChange={e => setForm({...form, cpfCnpj: maskCpfCnpj(e.target.value)})} placeholder="000.000.000-00" maxLength={18} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">RG *</label>
                      <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.rg || ''} onChange={e => setForm({...form, rg: maskRG(e.target.value)})} placeholder="00.000.000-0" maxLength={12} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data de Nascimento *</label>
                      <input type="date" required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.dataNascimento || ''} onChange={e => setForm({...form, dataNascimento: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sexo *</label>
                      <select required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.sexo || ''} onChange={e => setForm({...form, sexo: e.target.value})}>
                        <option value="">Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado Civil *</label>
                      <select required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.estadoCivil || ''} onChange={e => setForm({...form, estadoCivil: e.target.value})}>
                        <option value="">Selecione...</option>
                        <option value="Solteiro">Solteiro</option>
                        <option value="Casado">Casado</option>
                        <option value="Divorciado">Divorciado</option>
                        <option value="Viúvo">Viúvo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Profissão *</label>
                      <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.profissao || ''} onChange={e => setForm({...form, profissao: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Renda Mensal *</label>
                      <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.renda || ''} onChange={e => setForm({...form, renda: maskCurrency(e.target.value)})} placeholder="R$ 0,00" />
                    </div>
                  </div>
                )}

                {/* TAB 2: Endereço */}
                {activeTab === 2 && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CEP</label>
                      <input className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.cep || ''} onChange={e => setForm({...form, cep: maskCEP(e.target.value)})} placeholder="00.000-000" maxLength={10} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Logradouro *</label>
                      <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.logradouro || ''} onChange={e => setForm({...form, logradouro: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Número</label>
                      <input className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.numero || ''} onChange={e => setForm({...form, numero: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Complemento</label>
                      <input className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.complemento || ''} onChange={e => setForm({...form, complemento: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bairro</label>
                      <input className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.bairro || ''} onChange={e => setForm({...form, bairro: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cidade *</label>
                        <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.cidade || ''} onChange={e => setForm({...form, cidade: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado *</label>
                        <input required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.uf || ''} onChange={e => setForm({...form, uf: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Perfil de Busca */}
                {activeTab === 3 && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Finalidade</label>
                      <select className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.finalidade || ''} onChange={e => setForm({...form, finalidade: e.target.value})}>
                        <option value="">Selecione...</option>
                        <option value="Compra">Compra</option>
                        <option value="Locação">Locação</option>
                        <option value="Todos">Todos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Imóvel</label>
                      <select className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.tipoImovelBusca || ''} onChange={e => setForm({...form, tipoImovelBusca: e.target.value})}>
                        <option value="">Selecione...</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Casa">Casa</option>
                        <option value="Sobrado">Sobrado</option>
                        <option value="Sala Comercial">Sala Comercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Faixa de Preço Mínima</label>
                      <input className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.faixaMin || ''} onChange={e => setForm({...form, faixaMin: maskCurrency(e.target.value)})} placeholder="R$ 0,00" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Faixa de Preço Máxima</label>
                      <input className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.faixaMax || ''} onChange={e => setForm({...form, faixaMax: maskCurrency(e.target.value)})} placeholder="R$ 0,00" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quartos (Mínimo)</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.quartosBusca || ''} onChange={e => setForm({...form, quartosBusca: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Banheiros (Mínimo)</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.banheirosBusca || ''} onChange={e => setForm({...form, banheirosBusca: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bairro Ideal</label>
                      <input className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.bairroBusca || ''} onChange={e => setForm({...form, bairroBusca: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observações</label>
                      <textarea rows={3} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-[#0a2540] outline-none" value={form.observacoes || ''} onChange={e => setForm({...form, observacoes: e.target.value})}></textarea>
                    </div>
                  </div>
                )}

              </div>
              
              {/* FOOTER ACTIONS */}
              <div className="p-6 border-t bg-white flex justify-between items-center">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition outline-none">Cancelar</button>
                  <button type="button" onClick={() => { setForm({ tipo: 'Comprador', origem: 'Indicação' }); setActiveTab(0); }} className="px-5 py-2.5 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition outline-none">Limpar</button>
                </div>
                <div className="flex gap-3">
                  {activeTab > 0 && (
                    <button type="button" onClick={() => setActiveTab(activeTab - 1)} className="px-5 py-2.5 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition outline-none">Anterior</button>
                  )}
                  {activeTab < 3 ? (
                    <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="px-6 py-2.5 bg-[#0a2540] text-white rounded-lg font-bold hover:bg-[#06182c] transition shadow-md outline-none">Próximo</button>
                  ) : (
                    <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md outline-none">Salvar Cliente</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
