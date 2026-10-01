
import { useEffect, useState } from 'react';
import { api } from '../api';
import { RowActions } from '../components/DataTable';

export default function GenericCrud({ entity, title, fields }: { entity: string, title: string, fields: any[] }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);

  const load = () => {
    setLoading(true);
    api.get(`/${entity}`).then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load() }, [entity]);

  const save = async (e: any) => {
    e.preventDefault();
    if (form.id) await api.put(`/${entity}/${form.id}`, form);
    else await api.post(`/${entity}`, form);
    setForm(null);
    load();
  };

  const remove = async (id: number) => {
    if(confirm('Tem certeza?')) {
      await api.delete(`/${entity}/${id}`);
      load();
    }
  };

  if (form) return (
    <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl">
      <h2 className="text-xl font-bold mb-4">{form.id ? 'Editar' : 'Novo'} Registro</h2>
      <form onSubmit={save} className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{f.label}</label>
            <input 
              required
              className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none" 
              value={form[f.key] || ''} 
              onChange={e => setForm({...form, [f.key]: e.target.value})} 
            />
          </div>
        ))}
        <div className="flex gap-2 pt-4">
          <button type="button" onClick={() => setForm(null)} className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700">Salvar Dados</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <button onClick={() => setForm({})} className="bg-sky-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-sky-700">
          + Novo Registro
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">ID</th>
              {fields.map(f => <th key={f.key} className="px-4 py-3">{f.label}</th>)}
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={10} className="p-4 text-center text-slate-400">Carregando dados do banco...</td></tr> : 
             data.length === 0 ? <tr><td colSpan={10} className="p-4 text-center text-slate-400">Nenhum registro encontrado no banco de dados.</td></tr> :
             data.map(row => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-500">#{row.id}</td>
                {fields.map(f => <td key={f.key} className="px-4 py-3 font-medium text-slate-800">{row[f.key]}</td>)}
                <td className="px-4 py-3 text-right">
                  <RowActions onEdit={() => setForm(row)} onDelete={() => remove(row.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
