import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bath, BedDouble, Building2, Car, Edit2, LayoutGrid, LayoutList, Maximize, Plus, Trash2 } from 'lucide-react';
import { ActionButton, Badge, Card, DataTable, FilterSelect, PageHeader, Pager, RowActions, SearchInput, Toolbar, matches } from '../components/DataTable';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage, RelatedGrid } from '../components/EntityPage';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { parsePhotos } from '../lib/files';
import { formatCurrency, formatDate } from '../lib/format';
import { FINALIDADES_IMOVEL, TIPOS_IMOVEL, addressFields, statusColor } from '../lib/options';
import { Pode } from '../lib/auth';

const PAGE_SIZE = 10;
const isAluguel = (finalidade: unknown) => finalidade === 'Aluguel' || finalidade === 'Temporada';

// Preço exibido no card: venda ou aluguel, conforme a finalidade
export const precoImovel = (i: Record<string, any>) =>
  isAluguel(i.finalidade) || (!i.precoVenda && i.precoAluguel)
    ? (i.precoAluguel ? `${formatCurrency(i.precoAluguel)}/mês` : 'Sob consulta')
    : (i.precoVenda ? formatCurrency(i.precoVenda) : 'Sob consulta');

export const enderecoCurto = (i: Record<string, any>) =>
  [[i.logradouro, i.numero].filter(Boolean).join(', '), i.bairro, [i.cidade, i.uf].filter(Boolean).join('/')].filter(Boolean).join(' - ');

// Consultar Imóveis
export function ImoveisList() {
  const navigate = useNavigate();
  const { rows, loading, reload } = useList('imoveis');
  const proprietarios = useList('proprietarios');
  const [term, setTerm] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [tipo, setTipo] = useState('');
  const [bairro, setBairro] = useState('');
  const [quartos, setQuartos] = useState('');
  const [proprietario, setProprietario] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const del = useDelete('imoveis', 'Imóvel', reload);

  const bairros = [...new Set(rows.map(i => i.bairro).filter(Boolean))].sort();
  const filtered = rows.filter(i =>
    matches(term, i.titulo, i.id, i.cidade, i.bairro) &&
    (!finalidade || i.finalidade === finalidade) && (!tipo || i.tipo === tipo) && (!bairro || i.bairro === bairro) &&
    (!quartos || Number(i.quartos) >= Number(quartos)) && (!proprietario || String(i.proprietarioId) === String(proprietario))
  );

  useEffect(() => setPage(1), [filtered.length]);
  const currentCards = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key: 'id',
      label: 'Código',
      render: (r: any) => <span className="font-mono text-slate-500 font-medium">#{r.id}</span>,
      className: 'w-20',
    },
    {
      key: 'titulo',
      label: 'Imóvel',
      className: 'min-w-[180px]',
      render: (r: any) => {
        const foto = parsePhotos(r.fotos)[0];
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 flex items-center justify-center">
              {foto ? (
                <img src={foto} alt={r.titulo} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={20} className="text-slate-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-800 leading-snug">{r.titulo}</p>
              <p className="text-xs text-slate-400">{r.bairro ? `${r.bairro} · ` : ''}{r.cidade || ''}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (r: any) => r.tipo && <Badge className="bg-[#0a2540]/10 text-[#0a2540]">{r.tipo}</Badge>,
    },
    {
      key: 'finalidade',
      label: 'Finalidade',
      render: (r: any) => r.finalidade && (
        <Badge className={r.finalidade === 'Venda' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
          {r.finalidade}
        </Badge>
      ),
    },
    {
      key: 'preco',
      label: 'Preço',
      render: (r: any) => <span className="font-bold text-teal-700 text-sm whitespace-nowrap">{precoImovel(r)}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Imóveis" subtitle={`${rows.length} cadastrados`}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 transition ${viewMode === 'table' ? 'bg-[#0a2540] text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                title="Visualização em Tabela"
              >
                <LayoutList size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#0a2540] text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                title="Visualização em Cards"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <Pode acao="Criar"><button onClick={() => navigate('/imoveis/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c] shadow-sm"><Plus size={18} /> Novo Imóvel</button></Pode>
          </div>
        }
      />
      <Card>
        <Toolbar>
          <SearchInput value={term} onChange={setTerm} placeholder="Buscar por título, código ou cidade..." />
          <FilterSelect value={finalidade} onChange={setFinalidade} options={FINALIDADES_IMOVEL} placeholder="Todas as finalidades" />
          <FilterSelect value={tipo} onChange={setTipo} options={TIPOS_IMOVEL} placeholder="Todos os tipos" />
          <FilterSelect value={bairro} onChange={setBairro} options={bairros} placeholder="Todos os bairros" />
          <FilterSelect value={quartos} onChange={setQuartos} options={[{ value: '1', label: '1+ quartos' }, { value: '2', label: '2+ quartos' }, { value: '3', label: '3+ quartos' }, { value: '4', label: '4+ quartos' }]} placeholder="Todos os quartos" />
          <FilterSelect value={proprietario} onChange={setProprietario} options={proprietarios.rows.map(p => ({ value: String(p.id), label: p.nome }))} placeholder="Todos os proprietários" />
        </Toolbar>

        {viewMode === 'table' ? (
          <DataTable
            rows={filtered}
            loading={loading}
            onRowClick={r => navigate(`/imoveis/${r.id}`)}
            columns={columns}
            actions={r => (
              <RowActions
                onView={() => navigate(`/imoveis/${r.id}`)}
                onEdit={() => navigate(`/imoveis/${r.id}/editar`)}
                onDelete={() => del.ask(r.id, r.titulo)}
              />
            )}
          />
        ) : (
          <div className="flex flex-col justify-between min-h-[560px] lg:min-h-[calc(100vh-250px)]">
            <div className="flex-1 p-5">
              {loading ? (
                <p className="p-12 text-center text-slate-400">Carregando...</p>
              ) : !filtered.length ? (
                <p className="p-12 text-center text-slate-400">Nenhum imóvel encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {currentCards.map(i => {
                    const foto = parsePhotos(i.fotos)[0];
                    return (
                      <div key={i.id} onClick={() => navigate(`/imoveis/${i.id}`)} className="group border rounded-xl overflow-hidden bg-white hover:shadow-md transition cursor-pointer flex flex-col justify-between">
                        <div>
                          <div className="h-44 bg-slate-100 relative overflow-hidden">
                            {foto ? (
                              <img src={foto} alt={i.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><Building2 size={48} /></div>
                            )}
                            <div className="absolute left-3 top-3 flex gap-2">
                              {i.finalidade && <Badge className="bg-white/90 text-slate-700">{i.finalidade}</Badge>}
                              {i.tipo && <Badge className="bg-[#0a2540]/90 text-white">{i.tipo}</Badge>}
                            </div>
                            <div className="absolute right-2 top-2 flex gap-0.5 p-0.5 rounded-lg bg-white/90 shadow-sm opacity-100 sm:opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                              <Pode acao="Editar"><ActionButton tone="edit" title="Editar" onClick={() => navigate(`/imoveis/${i.id}/editar`)}><Edit2 size={15} /></ActionButton></Pode>
                              <Pode acao="Excluir"><ActionButton tone="delete" title="Excluir" onClick={() => del.ask(i.id, i.titulo)}><Trash2 size={15} /></ActionButton></Pode>
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
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <p className="text-lg font-bold text-teal-600">{precoImovel(i)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Pager page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
          </div>
        )}
      </Card>
      {del.modal}
    </div>
  );
}

// Visitas, negociações e contratos do imóvel (somente leitura)
function ImovelRelacionamentos({ imovelId }: { imovelId: number }) {
  const navigate = useNavigate();
  const visitas = useList('visitas', { imovelId });
  const negociacoes = useList('negociacoes', { imovelId });
  const contratos = useList('contratos', { imovelId });
  const clientes = useList('clientes');
  const cliente = (id: number) => clientes.rows.find(c => c.id === id)?.nome || `#${id}`;

  return (
    <>
      <RelatedGrid title="Contratos">
        <DataTable
          compact
          rows={contratos.rows} loading={contratos.loading} empty="Nenhum contrato vinculado a este imóvel."
          columns={[
            { key: 'id', label: 'ID Contrato', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'cliente', label: 'Inquilino / Comprador', render: r => r.clienteNome || cliente(r.clienteId) },
            { key: 'tipo', label: 'Tipo', render: r => <span className="font-semibold text-xs">{r.tipo}</span> },
            { key: 'vigencia', label: 'Início Vigência', render: r => formatDate(r.dataInicio) },
            { key: 'valor', label: 'Valor', render: r => formatCurrency(r.valor) },
            { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={r => <RowActions onView={() => navigate(`/contratos/${r.id}`)} />}
        />
      </RelatedGrid>
      <RelatedGrid title="Visitas">
        <DataTable
          compact
          rows={visitas.rows} loading={visitas.loading} empty="Nenhuma visita registrada."
          columns={[
            { key: 'id', label: 'ID da Visita', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'cliente', label: 'Cliente', render: r => cliente(r.clienteId) },
            { key: 'data', label: 'Data', render: r => formatDate(r.data) },
            { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={r => <RowActions onView={() => navigate(`/visitas/${r.id}`)} />}
        />
      </RelatedGrid>
      <RelatedGrid title="Negociações">
        <DataTable
          compact
          rows={negociacoes.rows} loading={negociacoes.loading} empty="Nenhuma negociação registrada."
          columns={[
            { key: 'id', label: 'ID da Proposta', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
            { key: 'cliente', label: 'Cliente', render: r => cliente(r.clienteId) },
            { key: 'data', label: 'Data', render: r => formatDate(r.data) },
            { key: 'valor', label: 'Valor', render: r => formatCurrency(r.valor) },
            { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={r => <RowActions onView={() => navigate(`/negociacoes/${r.id}`)} />}
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
