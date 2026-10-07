import { useState } from 'react';
import {
  Building2,
  FileSpreadsheet,
  Handshake,
  Landmark,
  Printer,
  Shield,
  ShieldAlert,
  User,
  Wrench,
} from 'lucide-react';
import { Badge, Card, DataTable, FilterSelect, PageHeader, SearchInput, Toolbar, matches } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useList } from '../lib/useApi';
import { formatCurrency, formatDate } from '../lib/format';
import { statusColor } from '../lib/options';

type ReportTab = 'propostas' | 'intervencoes' | 'financeiro' | 'relacionamentos' | 'auditoria';

// Função utilitária de exportação genérica para CSV/Excel nativo (RNF 1.3 - pág. 32)
function exportGridToCsv(headers: string[], rows: (string | number | null | undefined)[][], filename: string) {
  const sanitizedRows = rows.map(r =>
    r.map(cell => (cell === null || cell === undefined ? '' : `"${String(cell).replace(/"/g, '""')}"`)).join(';')
  );
  const csvContent = '\uFEFF' + [headers.join(';'), ...sanitizedRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const PERIODOS_RELATORIO = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'mes_atual', label: 'Este mês' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'ano_atual', label: 'Este ano' },
  { value: 'ultimos_30', label: 'Últimos 30 dias' },
  { value: 'ultimos_90', label: 'Últimos 90 dias' },
];

export default function Relatorios() {
  const toast = useToast();
  const [tab, setTab] = useState<ReportTab>('propostas');

  // Filtros Globais (RNF 1.2: filtros por período e por Usuário Responsável)
  const [periodoFiltro, setPeriodoFiltro] = useState('');
  const [responsavelFiltro, setResponsavelFiltro] = useState('');
  const [term, setTerm] = useState('');

  // Carregamento dos dados das fontes
  const negociacoes = useList('negociacoes');
  const reparos = useList('reparos');
  const financeiro = useList('financeiro');
  const imoveis = useList('imoveis');
  const proprietarios = useList('proprietarios');
  const funcionarios = useList('funcionarios');
  const auditoria = useList('auditoria');

  const corretores = funcionarios.rows.filter(f => f.cargo === 'Corretor');

  const hoje = new Date().toISOString().slice(0, 10);
  const [ano, mes] = hoje.split('-');
  const mesAtualInicio = `${ano}-${mes}-01`;
  const mesAntNum = Number(mes) === 1 ? 12 : Number(mes) - 1;
  const mesAntAno = Number(mes) === 1 ? Number(ano) - 1 : Number(ano);
  const mesAntInicio = `${mesAntAno}-${String(mesAntNum).padStart(2, '0')}-01`;
  const mesAntFim = `${mesAntAno}-${String(mesAntNum).padStart(2, '0')}-31`;
  const anoAtualInicio = `${ano}-01-01`;
  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const iso30 = d30.toISOString().slice(0, 10);
  const d90 = new Date(); d90.setDate(d90.getDate() - 90);
  const iso90 = d90.toISOString().slice(0, 10);

  const filtraData = (d?: string) => {
    if (!periodoFiltro || !d) return true;
    if (periodoFiltro === 'hoje') return d === hoje;
    if (periodoFiltro === 'mes_atual') return d >= mesAtualInicio && d <= hoje;
    if (periodoFiltro === 'mes_anterior') return d >= mesAntInicio && d <= mesAntFim;
    if (periodoFiltro === 'ano_atual') return d >= anoAtualInicio && d <= hoje;
    if (periodoFiltro === 'ultimos_30') return d >= iso30 && d <= hoje;
    if (periodoFiltro === 'ultimos_90') return d >= iso90 && d <= hoje;
    return true;
  };

  // 1. RELATÓRIO: HISTÓRICO DE PROPOSTAS E NEGOCIAÇÕES (RF F68)
  const filteredPropostas = negociacoes.rows
    .filter(n => (!responsavelFiltro ? true : String(n.corretorId) === responsavelFiltro || n.corretor === responsavelFiltro))
    .filter(n => filtraData(n.data))
    .filter(n => matches(term, n.id, n.clienteNome, n.imovelTitulo, n.corretor, n.status, n.tipo, n.formaPagamento));

  // 2. RELATÓRIO: HISTÓRICO DE INTERVENÇÕES E REPAROS (RF F69)
  const filteredReparos = reparos.rows
    .filter(r => (!responsavelFiltro ? true : String(r.responsavelId) === responsavelFiltro || r.responsavel === responsavelFiltro))
    .filter(r => filtraData(r.dataSolicitacao))
    .filter(r => matches(term, r.id, r.descricao, r.responsavel, r.status));

  // 3. RELATÓRIO: HISTÓRICO FINANCEIRO & REPASSES (RF F70)
  const filteredFinanceiro = financeiro.rows
    .filter(f => (!responsavelFiltro ? true : f.operador === responsavelFiltro))
    .filter(f => filtraData(f.dataVencimento || f.dataPagamento))
    .filter(f => matches(term, f.id, f.descricao, f.categoria, f.tipo, f.status, f.clienteNome, f.proprietarioNome, f.reciboNumero));

  // 4. RELATÓRIO: VÍNCULOS DE IMÓVEIS E PROPRIETÁRIOS (RF F71)
  const filteredRelacionamentos = imoveis.rows
    .filter(i => (!responsavelFiltro ? true : String(i.responsavelId) === responsavelFiltro || i.responsavel === responsavelFiltro))
    .filter(i => matches(term, i.id, i.titulo, i.tipo, i.finalidade, i.responsavel, i.cidade, i.bairro));

  // 5. RELATÓRIO DE LOG DE AUDITORIA (RF F74)
  const filteredAuditoria = auditoria.rows
    .filter(a => (!responsavelFiltro ? true : a.usuario?.includes(responsavelFiltro)))
    .filter(a => filtraData(a.data))
    .filter(a => matches(term, a.id, a.usuario, a.acao, a.entidade, a.detalhes, a.ip));

  // Ações de Exportação
  const exportarAtual = () => {
    const dataHora = new Date().toISOString().slice(0, 10);
    if (tab === 'propostas') {
      const headers = ['ID Proposta', 'Data', 'Cliente', 'Imóvel', 'Corretor', 'Tipo', 'Valor Proposto', 'Status', 'Forma Pagamento'];
      const rows = filteredPropostas.map(p => [p.id, p.data, p.clienteNome, p.imovelTitulo, p.corretor, p.tipo, p.valor, p.status, p.formaPagamento]);
      exportGridToCsv(headers, rows, `urbania_relatorio_propostas_${dataHora}`);
    } else if (tab === 'intervencoes') {
      const headers = ['ID Reparo', 'Data Solicitação', 'Imóvel #', 'Responsável', 'Orçamento (R$)', 'Status', 'Problemas'];
      const rows = filteredReparos.map(r => [r.id, r.dataSolicitacao, r.imovelId, r.responsavel, r.valor, r.status, r.descricao]);
      exportGridToCsv(headers, rows, `urbania_relatorio_intervencoes_${dataHora}`);
    } else if (tab === 'financeiro') {
      const headers = ['ID', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Vencimento', 'Pagamento', 'Status', 'Recibo'];
      const rows = filteredFinanceiro.map(f => [f.id, f.tipo, f.categoria, f.descricao, f.valor, f.dataVencimento, f.dataPagamento, f.status, f.reciboNumero]);
      exportGridToCsv(headers, rows, `urbania_relatorio_financeiro_${dataHora}`);
    } else if (tab === 'relacionamentos') {
      const headers = ['ID Imóvel', 'Título', 'Tipo', 'Finalidade', 'Proprietário Legal', 'Corretor Captador', 'Preço Venda', 'Preço Aluguel'];
      const rows = filteredRelacionamentos.map(i => {
        const prop = proprietarios.rows.find(p => p.id === i.proprietarioId);
        return [i.id, i.titulo, i.tipo, i.finalidade, prop?.nome || '—', i.responsavel || '—', i.precoVenda, i.precoAluguel];
      });
      exportGridToCsv(headers, rows, `urbania_relatorio_vinculos_${dataHora}`);
    } else if (tab === 'auditoria') {
      const headers = ['ID Log', 'Data', 'Hora', 'Usuário Autenticado', 'Ação', 'Entidade', 'Registro #', 'Endereço IP', 'Detalhes da Operação'];
      const rows = filteredAuditoria.map(a => [a.id, a.data, a.hora, a.usuario, a.acao, a.entidade, a.entidadeId, a.ip, a.detalhes]);
      exportGridToCsv(headers, rows, `urbania_relatorio_auditoria_logs_${dataHora}`);
    }
    toast.success('Relatório exportado com sucesso (.csv / Excel).');
  };

  const tabsConfig = [
    { id: 'propostas', label: 'Histórico de Propostas (F68)', icon: <Handshake size={16} /> },
    { id: 'intervencoes', label: 'Intervenções & Reparos (F69)', icon: <Wrench size={16} /> },
    { id: 'financeiro', label: 'Extrato & Repasses (F70)', icon: <Landmark size={16} /> },
    { id: 'relacionamentos', label: 'Vínculos de Imóveis (F71)', icon: <Building2 size={16} /> },
    { id: 'auditoria', label: 'Log de Auditoria (F74)', icon: <Shield size={16} /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Históricos & Relatórios do Sistema"
        subtitle="Rastreabilidade completa de propostas, intervenções, operações financeiras e logs de auditoria"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition text-sm shadow-xs"
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button
              onClick={exportarAtual}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-sm shadow-xs"
            >
              <FileSpreadsheet size={16} /> Exportar (.xlsx/CSV)
            </button>
          </div>
        }
      />

      {/* Seletor de Abas de Relatórios */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {tabsConfig.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as ReportTab)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition ${
              tab === t.id
                ? 'border-[#0a2540] text-[#0a2540]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {/* Barra de Filtros Obrigatórios: Período e Responsável (RNF 1.2 - pág. 32) */}
        <Toolbar>
          <SearchInput
            value={term}
            onChange={setTerm}
            placeholder="Busca por termo ou palavra-chave no relatório..."
          />

          <FilterSelect
            value={responsavelFiltro}
            onChange={setResponsavelFiltro}
            options={corretores.map(c => ({ value: String(c.id), label: `Resp: ${c.nome}${c.status === 'Inativo' ? ' (Inativo)' : ''}` }))}
            placeholder="Todos os responsáveis"
          />

          <FilterSelect
            value={periodoFiltro}
            onChange={setPeriodoFiltro}
            options={PERIODOS_RELATORIO}
            placeholder="Todos os períodos"
          />
        </Toolbar>

        {/* 1. ABA PROPOSTAS E NEGOCIAÇÕES */}
        {tab === 'propostas' && (
          <DataTable
            pageSize={30} // RNF 1.4: paginação caso exceda 30 registros
            rows={filteredPropostas}
            loading={negociacoes.loading}
            empty="Nenhuma proposta registrada no período."
            columns={[
              { key: 'id', label: 'ID', render: r => <span className="font-mono text-slate-400">#{r.id}</span>, className: 'w-16' },
              { key: 'data', label: 'Data', render: r => formatDate(r.data) },
              { key: 'cliente', label: 'Cliente', render: r => <span className="font-semibold text-slate-800">{r.clienteNome || `#${r.clienteId}`}</span> },
              { key: 'imovel', label: 'Imóvel Negociado', render: r => r.imovelTitulo || `#${r.imovelId}` },
              { key: 'corretor', label: 'Corretor', render: r => r.corretor || '—' },
              { key: 'tipo', label: 'Tipo', render: r => <span className="text-xs font-semibold text-cadastro">{r.tipo}</span> },
              { key: 'valor', label: 'Valor Proposto', render: r => <span className="font-bold text-teal-700">{formatCurrency(r.valor)}</span> },
              { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
            ]}
          />
        )}

        {/* 2. ABA INTERVENÇÕES E REPAROS */}
        {tab === 'intervencoes' && (
          <DataTable
            pageSize={30}
            rows={filteredReparos}
            loading={reparos.loading}
            empty="Nenhuma intervenção ou reparo registrado no período."
            columns={[
              { key: 'id', label: 'ID', render: r => <span className="font-mono text-slate-400">#{r.id}</span>, className: 'w-16' },
              { key: 'dataSolicitacao', label: 'Data', render: r => formatDate(r.dataSolicitacao) },
              { key: 'imovelId', label: 'Imóvel #', render: r => `#${r.imovelId}` },
              { key: 'descricao', label: 'Problemas Identificados', render: r => <span className="font-medium text-slate-800">{r.descricao}</span> },
              { key: 'responsavel', label: 'Responsável', render: r => r.responsavel || '—' },
              { key: 'valor', label: 'Orçamento', render: r => <span className="font-bold text-slate-800">{formatCurrency(r.valor)}</span> },
              { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
            ]}
          />
        )}

        {/* 3. ABA FINANCEIRO E REPASSES */}
        {tab === 'financeiro' && (
          <DataTable
            pageSize={30}
            rows={filteredFinanceiro}
            loading={financeiro.loading}
            empty="Nenhum lançamento financeiro localizado no período."
            columns={[
              { key: 'id', label: 'ID', render: r => <span className="font-mono text-slate-400">#{r.id}</span>, className: 'w-16' },
              { key: 'tipo', label: 'Tipo', render: r => <span className="text-xs font-semibold text-cadastro">{r.tipo}</span> },
              { key: 'descricao', label: 'Descrição & Categoria', render: r => (
                <div>
                  <p className="font-semibold text-slate-800">{r.descricao}</p>
                  <p className="text-xs text-slate-400">{r.categoria} {r.reciboNumero ? `· ${r.reciboNumero}` : ''}</p>
                </div>
              ) },
              { key: 'vencimento', label: 'Vencimento', render: r => formatDate(r.dataVencimento) },
              { key: 'valor', label: 'Valor', render: r => <span className="font-bold text-teal-700">{formatCurrency(r.valor)}</span> },
              { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
            ]}
          />
        )}

        {/* 4. ABA VÍNCULOS DE IMÓVEIS E PROPRIETÁRIOS */}
        {tab === 'relacionamentos' && (
          <DataTable
            pageSize={30}
            rows={filteredRelacionamentos}
            loading={imoveis.loading}
            empty="Nenhum vínculo de imóvel localizado."
            columns={[
              { key: 'id', label: 'ID Imóvel', render: r => <span className="font-mono text-slate-400">#{r.id}</span>, className: 'w-20' },
              { key: 'titulo', label: 'Imóvel', render: r => (
                <div>
                  <p className="font-semibold text-slate-800">{r.titulo}</p>
                  <p className="text-xs text-slate-400">{r.bairro} - {r.cidade}/{r.uf}</p>
                </div>
              ) },
              { key: 'tipo', label: 'Tipo / Finalidade', render: r => <span className="text-xs font-semibold text-cadastro">{`${r.tipo} (${r.finalidade})`}</span> },
              { key: 'proprietario', label: 'Proprietário Legal', render: r => {
                const prop = proprietarios.rows.find(p => p.id === r.proprietarioId);
                return <span className="font-semibold text-slate-700">{prop?.nome || '—'}</span>;
              } },
              { key: 'responsavel', label: 'Corretor Captador', render: r => r.responsavel || '—' },
              { key: 'valores', label: 'Valores Registrados', render: r => (
                <div className="text-xs font-semibold">
                  {r.precoVenda ? <p className="text-indigo-700">Venda: {formatCurrency(r.precoVenda)}</p> : null}
                  {r.precoAluguel ? <p className="text-teal-700">Locação: {formatCurrency(r.precoAluguel)}/mês</p> : null}
                </div>
              ) },
            ]}
          />
        )}

        {/* 5. ABA RELATÓRIO DE LOG DE AUDITORIA (RF F74) */}
        {tab === 'auditoria' && (
          <div>
            <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
                <ShieldAlert size={18} className="text-amber-600" />
                <span>Módulo de Auditoria e Conformidade Legal (Acesso restrito ao perfil Administrador - RNF 4.2)</span>
              </div>
              <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                Audit Trail Ativo
              </span>
            </div>
            <DataTable
              pageSize={30}
              rows={filteredAuditoria}
              loading={auditoria.loading}
              empty="Nenhum registro de log registrado no período selecionado."
              columns={[
                { key: 'id', label: 'ID Log', render: r => <span className="font-mono text-slate-400 text-xs">#{r.id}</span>, className: 'w-16' },
                { key: 'timestamp', label: 'Data e Hora', render: r => (
                  <span className="text-xs font-medium text-slate-700">
                    {formatDate(r.data)} {r.hora ? `às ${r.hora}` : ''}
                  </span>
                ) },
                { key: 'usuario', label: 'Usuário Logado', render: r => (
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <span className="font-semibold text-slate-800 text-xs">{r.usuario || 'Sistema'}</span>
                  </div>
                ) },
                { key: 'ip', label: 'Endereço IP', render: r => <span className="font-mono text-xs text-slate-500">{r.ip || '127.0.0.1'}</span> },
                { key: 'acao', label: 'Operação', render: r => (
                  <Badge className={
                    r.acao === 'Criação' ? 'bg-emerald-100 text-emerald-800' :
                    r.acao === 'Exclusão' ? 'bg-rose-100 text-rose-800' :
                    r.acao === 'Baixa de Pagamento' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                  }>
                    {r.acao}
                  </Badge>
                ) },
                { key: 'entidade', label: 'Entidade / Registro', render: r => (
                  <span className="text-xs font-mono text-slate-700 font-semibold">
                    {r.entidade} {r.entidadeId ? `(#${r.entidadeId})` : ''}
                  </span>
                ) },
                { key: 'detalhes', label: 'Detalhes da Ação Sistêmica', render: r => (
                  <span className="text-xs text-slate-600 line-clamp-1">{r.detalhes}</span>
                ) },
              ]}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
