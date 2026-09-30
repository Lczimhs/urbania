import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bath, BedDouble, Building2, Car, Edit2, Eye, Maximize, Plus, Trash2 } from 'lucide-react';
import { Badge, Card, DataTable, FilterSelect, PageHeader, Pager, SearchInput, Toolbar, matches } from '../components/DataTable';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage, RelatedGrid } from '../components/EntityPage';
import { SearchSelect } from '../components/SearchSelect';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { parsePhotos } from '../lib/files';
import { formatCurrency, formatDate } from '../lib/format';
import { FINALIDADES_IMOVEL, TIPOS_IMOVEL, addressFields, statusColor } from '../lib/options';

const PAGE_SIZE = 10;
const isAluguel = (finalidade: unknown) => finalidade === 'Aluguel' || finalidade === 'Temporada';

// Preço exibido no card: venda ou aluguel, conforme a finalidade
export const precoImovel = (i: Record<string, any>) =>
  isAluguel(i.finalidade) || (!i.precoVenda && i.precoAluguel)
    ? (i.precoAluguel ? `${formatCurrency(i.precoAluguel)}/mês` : 'Sob consulta')
    : (i.precoVenda ? formatCurrency(i.precoVenda) : 'Sob consulta');

export const enderecoCurto = (i: Record<string, any>) =>
  [[i.logradouro, i.numero].filter(Boolean).join(', '), i.bairro, [i.cidade, i.uf].filter(Boolean).join('/')].filter(Boolean).join(' - ');

// Consultar Imóveis (em cards)
export function ImoveisList() {
  const navigate = useNavigate();
  const { rows, loading, reload } = useList('imoveis');
  const proprietarios = useList('proprietarios');
  const [term, setTerm] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [tipo, setTipo] = useState('');
  const [bairro, setBairro] = useState('');
  const [quartos, setQuartos] = useState('');
  const [proprietario, setProprietario] = useState<string | number | null>(null);
  const [page, setPage] = useState(1);
  const del = useDelete('imoveis', 'Imóvel', reload);

  const bairros = [...new Set(rows.map(i => i.bairro).filter(Boolean))].sort();
  const filtered = rows.filter(i =>
    matches(term, i.titulo, i.id, i.cidade) &&
    (!finalidade || i.finalidade === finalidade) && (!tipo || i.tipo === tipo) && (!bairro || i.bairro === bairro) &&
    (!quartos || Number(i.quartos || 0) >= Number(quartos)) &&
    (!proprietario || String(i.proprietarioId) === String(proprietario)));

  useEffect(() => setPage(1), [filtered.length]);
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Imóveis" subtitle={`${rows.length} cadastrados`}
        action={<button onClick={() => navigate('/imoveis/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c]"><Plus size={18} /> Novo Imóvel</button>}
      />
      <Card>
        <Toolbar>
          <SearchInput value={term} onChange={setTerm} placeholder="Buscar por título, código ou cidade..." />
          <FilterSelect value={finalidade} onChange={setFinalidade} options={FINALIDADES_IMOVEL} placeholder="Finalidade" />
          <FilterSelect value={tipo} onChange={setTipo} options={TIPOS_IMOVEL} placeholder="Tipo" />
          <FilterSelect value={bairro} onChange={setBairro} options={bairros} placeholder="Bairro" />
          <FilterSelect value={quartos} onChange={setQuartos} options={[{ value: '1', label: '1+ quartos' }, { value: '2', label: '2+ quartos' }, { value: '3', label: '3+ quartos' }, { value: '4', label: '4+ quartos' }]} placeholder="Quartos" />
          <div className="w-full md:w-56">
            <SearchSelect value={proprietario} onChange={setProprietario} placeholder="Todos os proprietários"
              options={proprietarios.rows.map(p => ({ value: p.id, label: p.nome }))} />
          </div>
        </Toolbar>

        {loading ? <p className="p-8 text-center text-slate-400">Carregando...</p>
          : !filtered.length ? <p className="p-8 text-center text-slate-400">Nenhum imóvel encontrado.</p>
          : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {current.map(i => {
                const foto = parsePhotos(i.fotos)[0];
                return (
                  <div key={i.id} onClick={() => navigate(`/imoveis/${i.id}`)} className="group border rounded-xl overflow-hidden bg-white hover:shadow-md transition cursor-pointer">
                    <div className="h-44 bg-slate-100 relative overflow-hidden">
                      {foto
                        ? <img src={foto} alt={i.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300"><Building2 size={48} /></div>}
                      <div className="absolute left-3 top-3 flex gap-2">
                        {i.finalidade && <Badge className="bg-white/90 text-slate-700">{i.finalidade}</Badge>}
                        {i.tipo && <Badge className="bg-[#0a2540]/90 text-white">{i.tipo}</Badge>}
                      </div>
                      <div className="absolute right-2 top-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                        <button title="Editar" onClick={() => navigate(`/imoveis/${i.id}/editar`)} className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-amber-600"><Edit2 size={16} /></button>
                        <button title="Excluir" onClick={() => del.ask(i.id, i.titulo)} className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] font-mono text-slate-400">#{i.id}</p>
                      <h3 className="font-bold text-slate-800 leading-snug">{i.titulo}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{enderecoCurto(i) || 'Endereço não informado'}</p>
                      <div className="flex gap-3 text-xs text-slate-500 mt-3">
                        {!!i.quartos && <span className="flex items-center gap-1"><BedDouble size={14} />{i.quartos}</span>}
                        {!!i.banheiros && <span className="flex items-center gap-1"><Bath size={14} />{i.banheiros}</span>}
                        {!!i.vagas && <span className="flex items-center gap-1"><Car size={14} />{i.vagas}</span>}
                        {!!i.areaTotal && <span className="flex items-center gap-1"><Maximize size={14} />{i.areaTotal} m²</span>}
                      </div>
                      <p className="text-lg font-bold text-teal-600 mt-3">{precoImovel(i)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        <Pager page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </Card>
      {del.modal}
    </div>
  );
}

// Visitas e negociações do imóvel (somente leitura)
function ImovelRelacionamentos({ imovelId }: { imovelId: number }) {
  const navigate = useNavigate();
  const visitas = useList('visitas', { imovelId });
  const negociacoes = useList('negociacoes', { imovelId });
  const clientes = useList('clientes');
  const cliente = (id: number) => clientes.rows.find(c => c.id === id)?.nome || `#${id}`;

  return (
    <>
      <RelatedGrid title="Visitas">
        <DataTable
          rows={visitas.rows} loading={visitas.loading} empty="Nenhuma visita registrada."
          columns={[
            { key: 'id', label: 'ID da Visita', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'cliente', label: 'Cliente', render: r => cliente(r.clienteId) },
            { key: 'data', label: 'Data', render: r => formatDate(r.data) },
            { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={r => <button type="button" onClick={() => navigate(`/visitas/${r.id}`)} className="inline-flex items-center gap-1 text-sky-600 font-semibold text-xs hover:underline"><Eye size={14} /> Visualizar</button>}
        />
      </RelatedGrid>
      <RelatedGrid title="Negociações">
        <DataTable
          rows={negociacoes.rows} loading={negociacoes.loading} empty="Nenhuma negociação registrada."
          columns={[
            { key: 'id', label: 'ID da Proposta', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'cliente', label: 'Cliente', render: r => cliente(r.clienteId) },
            { key: 'data', label: 'Data', render: r => formatDate(r.data) },
            { key: 'valor', label: 'Valor', render: r => formatCurrency(r.valor) },
            { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={() => <span title="A tela de negociações ainda não foi desenvolvida" className="text-slate-300 text-xs font-semibold">Visualizar</span>}
        />
      </RelatedGrid>
    </>
  );
}

// Cadastrar / Visualizar / Editar Imóvel
export function ImovelPage({ mode }: { mode: Mode }) {
  const proprietarios = useList('proprietarios');
  const corretores = useList('funcionarios', { cargo: 'Corretor' });

  if (proprietarios.loading || corretores.loading) return <p className="text-slate-400 p-8">Carregando...</p>;

  const tabs: TabDef[] = [
    { label: 'Dados Básicos', fields: [
      { key: 'tipo', label: 'Tipo do Imóvel', type: 'select', options: TIPOS_IMOVEL, required: true },
      { key: 'finalidade', label: 'Finalidade', type: 'select', options: FINALIDADES_IMOVEL, required: true },
      { key: 'proprietarioId', label: 'Proprietário', type: 'search-select', required: true,
        options: proprietarios.rows.map(p => ({ value: p.id, label: p.nome, hint: p.tipo === 'Jurídica' ? p.cnpj : p.cpfCnpj })) },
      { key: 'responsavelId', label: 'Responsável (Corretor)', type: 'select',
        options: corretores.rows.map(c => ({ value: c.id, label: c.nome })) },
      { key: 'titulo', label: 'Título', required: true, full: true, placeholder: 'Ex.: Apartamento 3 quartos no Centro' },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ] },
    { label: 'Endereço', fields: addressFields(true).map(f => (f.key === 'complemento' ? f : { ...f, required: f.key !== 'numero' })) },
    { label: 'Valores', fields: [
      { key: 'precoVenda', label: 'Preço de Venda', type: 'currency', required: f => f.finalidade === 'Venda' || f.finalidade === 'Venda e Aluguel' },
      { key: 'precoAluguel', label: 'Aluguel', type: 'currency', required: f => f.finalidade !== 'Venda' && !!f.finalidade },
      { key: 'condominio', label: 'Condomínio', type: 'currency' },
      { key: 'iptu', label: 'IPTU', type: 'currency' },
    ] },
    { label: 'Características', fields: [
      { key: 'areaTotal', label: 'Área Total', type: 'number', suffix: 'm²' },
      { key: 'areaTerreno', label: 'Área do Terreno', type: 'number', suffix: 'm²' },
      { key: 'quartos', label: 'Quartos', type: 'number' },
      { key: 'suites', label: 'Suítes', type: 'number' },
      { key: 'banheiros', label: 'Banheiros', type: 'number' },
      { key: 'vagas', label: 'Vagas', type: 'number' },
    ] },
    { label: 'Fotos', fields: [{ key: 'fotos', label: 'Fotos do Imóvel (a primeira é a principal)', type: 'photos' }] },
  ];

  return (
    <EntityPage
      mode={mode} entity="imoveis" basePath="/imoveis" singular="Imóvel" tabs={tabs}
      validate={f => {
        const neg = ['areaTotal', 'areaTerreno', 'quartos', 'suites', 'banheiros', 'vagas'].find(k => Number(f[k]) < 0);
        if (neg) return 'As características não podem ter valores negativos.';
        if (Number(f.suites || 0) > Number(f.quartos || 0)) return 'O número de suítes não pode ser maior que o de quartos.';
        return null;
      }}
      prepare={f => ({ ...f, responsavel: corretores.rows.find(c => String(c.id) === String(f.responsavelId))?.nome ?? null })}
      extraTabs={[{ label: 'Relacionamentos', render: f => <ImovelRelacionamentos imovelId={f.id} /> }]}
    />
  );
}
