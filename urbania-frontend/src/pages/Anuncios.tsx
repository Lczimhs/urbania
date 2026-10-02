import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { Badge, Card, DataTable, FilterSelect, PageHeader, RowActions, SearchInput, Toolbar, matches } from '../components/DataTable';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage } from '../components/EntityPage';
import { useFieldSearch } from '../components/FieldSearch';
import { Modal } from '../components/Modal';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { parsePhotos } from '../lib/files';
import { formatCurrency, todayISO } from '../lib/format';
import { FINALIDADES_IMOVEL, SITUACOES_ANUNCIO, TIPOS_IMOVEL } from '../lib/options';
import { enderecoCurto } from './Imoveis';
import { Pode } from '../lib/auth';

const situacaoColor = (s: unknown) => ({
  Ativo: 'bg-emerald-100 text-emerald-700',
  Pausado: 'bg-amber-100 text-amber-700',
  Encerrado: 'bg-slate-200 text-slate-700',
}[String(s)] || 'bg-slate-100 text-slate-600');

const QUARTOS = [{ value: '1', label: '1 quarto' }, { value: '2', label: '2 quartos' }, { value: '3', label: '3 ou + quartos' }];
const filtraQuartos = (filtro: string, quartos: unknown) =>
  !filtro || (filtro === '3' ? Number(quartos || 0) >= 3 : Number(quartos || 0) === Number(filtro));

// Preço sugerido para o anúncio conforme a finalidade do imóvel
const precoSugerido = (i: any) =>
  (i.finalidade === 'Aluguel' || i.finalidade === 'Temporada') ? i.precoAluguel : (i.precoVenda || i.precoAluguel);

// Consultar Anúncio
export function AnunciosList() {
  const navigate = useNavigate();
  const { rows, loading, reload } = useList('anuncios');
  const imoveis = useList('imoveis');
  const canais = useList('canais');
  const proprietarios = useList('proprietarios');
  const [quartos, setQuartos] = useState('');
  const [canal, setCanal] = useState('');
  const del = useDelete('anuncios', 'Anúncio', reload);

  const imovel = (id: unknown) => imoveis.rows.find(i => i.id === id) || {};
  const search = useFieldSearch<any>([
    { value: 'proprietario', label: 'Proprietário', get: a => proprietarios.rows.find(p => p.id === imovel(a.imovelId).proprietarioId)?.nome },
    { value: 'responsavel', label: 'Responsável', get: a => imovel(a.imovelId).responsavel },
    { value: 'endereco', label: 'Endereço', get: a => `${enderecoCurto(imovel(a.imovelId))} ${imovel(a.imovelId).cep || ''}` },
  ]);

  const filtered = rows.filter(a =>
    search.filter(a) && filtraQuartos(quartos, imovel(a.imovelId).quartos) && (!canal || String(a.canalId) === canal));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Anúncios" subtitle={`${rows.length} cadastrados`}
        action={<Pode acao="Criar"><button onClick={() => navigate('/anuncios/novo')} className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c]"><Plus size={18} /> Cadastrar Anúncio</button></Pode>}
      />
      <Card>
        <Toolbar>
          {search.controls}
          <FilterSelect value={quartos} onChange={setQuartos} options={QUARTOS} placeholder="Todos os quartos" />
          <FilterSelect value={canal} onChange={setCanal} options={canais.rows.map(c => ({ value: String(c.id), label: c.nome }))} placeholder="Todos os canais" />
        </Toolbar>
        <DataTable
          rows={filtered} loading={loading || imoveis.loading || canais.loading || proprietarios.loading}
          onRowClick={r => navigate(`/anuncios/${r.id}`)}
          columns={[
            { key: 'id', label: 'ID', render: r => `#${r.id}`, className: 'font-mono text-slate-500 w-20' },
            { key: 'imovel', label: 'Imóvel', render: r => {
              const i = imovel(r.imovelId);
              const foto = parsePhotos(r.fotos)[0] || parsePhotos(i.fotos)[0];
              return (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 flex items-center justify-center">
                    {foto ? <img src={foto} alt="" className="w-full h-full object-cover" /> : <Building2 size={20} className="text-slate-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 leading-snug">{i.titulo || `Imóvel #${r.imovelId}`}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{enderecoCurto(i)}</p>
                  </div>
                </div>
              );
            } },
            { key: 'canal', label: 'Canal', render: r => canais.rows.find(c => c.id === r.canalId)?.nome || r.canal || '-' },
            { key: 'quartos', label: 'Quartos', render: r => imovel(r.imovelId).quartos ?? '-' },
            { key: 'valor', label: 'Valor', render: r => <span className="font-bold text-teal-700 whitespace-nowrap">{formatCurrency(r.valor) || '-'}</span> },
            { key: 'status', label: 'Situação', render: r => r.status && <Badge className={situacaoColor(r.status)}>{r.status}</Badge> },
          ]}
          actions={r => (
            <RowActions onView={() => navigate(`/anuncios/${r.id}`)} onEdit={() => navigate(`/anuncios/${r.id}/editar`)} onDelete={() => del.ask(r.id, `Anúncio #${r.id}`)} />
          )}
        />
      </Card>
      {del.modal}
    </div>
  );
}

// Modal com grid de imóveis e filtros; clicar em um imóvel seleciona e fecha
function SelecionarImovelModal({ imoveis, onSelect, onClose }: { imoveis: any[]; onSelect: (imovel: any) => void; onClose: () => void }) {
  const [term, setTerm] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [tipo, setTipo] = useState('');
  const [bairro, setBairro] = useState('');
  const [quartos, setQuartos] = useState('');

  const bairros = [...new Set(imoveis.map(i => i.bairro).filter(Boolean))].sort();
  const filtered = imoveis.filter(i =>
    matches(term, i.titulo, i.id, i.cidade) &&
    (!finalidade || i.finalidade === finalidade) && (!tipo || i.tipo === tipo) && (!bairro || i.bairro === bairro) &&
    filtraQuartos(quartos, i.quartos));

  return (
    <Modal title="Selecionar Imóvel" onClose={onClose} wide>
      <Toolbar>
        <SearchInput value={term} onChange={setTerm} placeholder="Buscar por título, ID ou cidade..." />
        <FilterSelect value={finalidade} onChange={setFinalidade} options={FINALIDADES_IMOVEL} placeholder="Finalidade" />
        <FilterSelect value={tipo} onChange={setTipo} options={TIPOS_IMOVEL} placeholder="Tipo" />
        <FilterSelect value={bairro} onChange={setBairro} options={bairros} placeholder="Bairro" />
        <FilterSelect value={quartos} onChange={setQuartos} options={QUARTOS} placeholder="Quartos" />
      </Toolbar>
      <DataTable
        compact pageSize={8}
        rows={filtered} onRowClick={onSelect} empty="Nenhum imóvel encontrado."
        columns={[
          { key: 'id', label: 'ID', render: r => `#${r.id}`, className: 'font-mono text-slate-500' },
          { key: 'titulo', label: 'Título', render: r => (
            <div>
              <p className="font-semibold text-slate-800">{r.titulo}</p>
              <p className="text-xs text-slate-400">{enderecoCurto(r)}</p>
            </div>
          ) },
          { key: 'tipo', label: 'Tipo' },
          { key: 'finalidade', label: 'Finalidade' },
          { key: 'quartos', label: 'Quartos' },
        ]}
      />
    </Modal>
  );
}

// Dados do imóvel selecionado, sempre somente leitura
function DadosImovel({ imovel, proprietario, responsavel }: { imovel?: any; proprietario?: string; responsavel?: string }) {
  if (!imovel) {
    return <p className="mt-4 p-4 rounded-lg border border-dashed text-sm text-slate-500 bg-white">Selecione um imóvel para carregar os dados e liberar a aba "Dados do Anúncio".</p>;
  }
  const area = (v: unknown) => (v ? `${v} m²` : null);
  const campos: [string, unknown][] = [
    ['ID Imóvel', `#${imovel.id}`], ['Finalidade', imovel.finalidade], ['Tipo do Imóvel', imovel.tipo],
    ['Proprietário', proprietario], ['Responsável', responsavel],
    ['Logradouro', imovel.logradouro], ['Número', imovel.numero], ['Bairro', imovel.bairro],
    ['Cidade', imovel.cidade], ['Estado', imovel.uf], ['CEP', imovel.cep],
    ['Área Total', area(imovel.areaTotal)], ['Área do Terreno', area(imovel.areaTerreno)],
    ['Quartos', imovel.quartos], ['Suítes', imovel.suites], ['Banheiros', imovel.banheiros], ['Vagas', imovel.vagas],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 mt-5">
      {campos.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="py-1.5 text-slate-800 font-medium border-b border-slate-100 min-h-[2.25rem]">
            {value === null || value === undefined || value === '' ? <span className="text-slate-300">—</span> : String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

// Cadastrar / Visualizar / Editar Anúncio
export function AnuncioPage({ mode }: { mode: Mode }) {
  const imoveis = useList('imoveis');
  const canais = useList('canais');
  const proprietarios = useList('proprietarios');
  const funcionarios = useList('funcionarios');
  const [picker, setPicker] = useState<((imovel: any) => void) | null>(null);

  if (imoveis.loading || canais.loading || proprietarios.loading || funcionarios.loading) return <p className="text-slate-400 p-8">Carregando...</p>;

  const find = (list: any[], id: unknown) => list.find(x => String(x.id) === String(id));

  const tabs: TabDef[] = [
    { label: 'Dados do Imóvel',
      fields: [{
        key: 'imovelId', label: 'Selecionar Imóvel', type: 'custom', required: true, full: true,
        render: (value, set, { disabled, invalid }) => {
          const i = find(imoveis.rows, value);
          if (disabled) return <p className="py-2 text-slate-800 font-medium border-b border-slate-100">{i ? `#${i.id} - ${i.titulo}` : '—'}</p>;
          return (
            <button type="button" onClick={() => setPicker(() => (imovel: any) => set(imovel.id))}
              aria-invalid={invalid} className={`w-full px-3 py-2 border ${invalid ? 'border-red-500' : 'border-slate-300'} rounded-lg bg-white text-left flex justify-between items-center outline-none focus:ring-2 focus:ring-[#0a2540]`}>
              <span className={i ? 'text-slate-800' : 'text-slate-400'}>{i ? `#${i.id} - ${i.titulo}` : 'Clique para selecionar o imóvel...'}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
          );
        },
        // Sugere o valor do anúncio a partir do preço do imóvel
        onChange: (v, f) => (f.valor ? f : { ...f, valor: precoSugerido(find(imoveis.rows, v) || {}) ?? null }),
      }],
      render: form => {
        const i = find(imoveis.rows, form.imovelId);
        return (
          <DadosImovel imovel={i} proprietario={find(proprietarios.rows, i?.proprietarioId)?.nome}
            responsavel={find(funcionarios.rows, i?.responsavelId)?.nome ?? i?.responsavel} />
        );
      } },
    { label: 'Dados do Anúncio',
      locked: f => (f.imovelId ? null : 'Selecione um imóvel na aba "Dados do Imóvel" para liberar os dados do anúncio.'),
      fields: [
        { key: 'canalId', label: 'Canal de Publicação', type: 'select', required: true,
          options: canais.rows.map(c => ({ value: c.id, label: `${c.nome} (${c.tipoCanal})` })) },
        { key: 'valor', label: 'Valor', type: 'currency', required: true },
        { key: 'status', label: 'Situação', type: 'select', options: SITUACOES_ANUNCIO, required: true },
        { key: 'dataPublicacao', label: 'Data de Publicação', type: 'date', disabled: true, hidden: () => mode === 'create' },
        { key: 'descricao', label: 'Descrição', type: 'textarea', required: true },
        { key: 'fotos', label: 'Envio de Imagens', type: 'photos' },
      ] },
  ];

  return (
    <>
      <EntityPage
        mode={mode} entity="anuncios" basePath="/anuncios" singular="Anúncio" tabs={tabs} showClear={false}
        defaults={{ status: 'Ativo' }}
        validate={f => (Number(f.valor) <= 0 ? 'Informe um valor maior que zero para o anúncio.' : null)}
        prepare={(f, m) => ({
          ...f,
          canal: find(canais.rows, f.canalId)?.nome ?? null,
          dataPublicacao: m === 'create' ? todayISO() : f.dataPublicacao,
        })}
      />
      {picker && (
        <SelecionarImovelModal
          imoveis={imoveis.rows} onClose={() => setPicker(null)}
          onSelect={i => { picker(i); setPicker(null); }}
        />
      )}
    </>
  );
}
