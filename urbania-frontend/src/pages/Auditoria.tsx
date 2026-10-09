import { useState } from 'react';
import {
  FileSpreadsheet,
  Laptop,
  Printer,
  Shield,
  User,
  X,
} from 'lucide-react';
import { Badge, Card, DataTable, FilterSelect, PageHeader, SearchInput, Toolbar, matches } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useList } from '../lib/useApi';
import { formatDate } from '../lib/format';
import { exportGridToXlsx } from '../lib/exportExcel';

const PERIODOS_AUDITORIA = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'mes_atual', label: 'Este mês' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'ano_atual', label: 'Este ano' },
  { value: 'ultimos_30', label: 'Últimos 30 dias' },
  { value: 'ultimos_90', label: 'Últimos 90 dias' },
];

const ACOES_AUDITORIA = [
  { value: 'Criação', label: 'Criação / Inclusão' },
  { value: 'Alteração', label: 'Alteração / Edição' },
  { value: 'Exclusão', label: 'Exclusão' },
];

export default function Auditoria() {
  const toast = useToast();
  const auditoria = useList('auditoria');

  const [term, setTerm] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('');
  const [acaoFiltro, setAcaoFiltro] = useState('');
  const [selecionado, setSelecionado] = useState<any | null>(null);

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

  // Logs permitidos apenas em edição, inclusão e exclusão
  const filtered = auditoria.rows
    .filter(a => a.acao !== 'Login')
    .filter(a => (!acaoFiltro ? true : a.acao === acaoFiltro))
    .filter(a => filtraData(a.data))
    .filter(a => matches(term, a.id, a.usuario, a.computador, a.acao, a.entidade, a.entidadeId, a.detalhes, a.ip));

  const formatComputador = (r: any) => {
    if (r.computador && (r.computador.startsWith('Pc-') || r.computador.startsWith('Pc_'))) {
      return r.computador;
    }
    if (r.computador && r.computador.trim()) {
      return `Pc-${r.computador.trim().replace(/^Pc[-_]/i, '')}`;
    }
    const activeDevice = localStorage.getItem('urbania_device_name');
    if (activeDevice) return activeDevice;
    return 'Pc-GM';
  };

  const formatUsuarioDisplay = (rawUsuario?: string) => {
    const str = (rawUsuario || 'Sistema').trim();
    const match = str.match(/^(.*?)(?:\s*\((.*?)\))?$/);
    let nome = match?.[1]?.trim() || str;
    let cargo = match?.[2]?.trim();

    nome = nome.replace(/\s*\((?:Admin|Administrador)\)\s*/gi, '').trim();

    if (!cargo || /admin|administrador|diretoria/i.test(cargo)) {
      cargo = 'Administração';
    }

    return {
      nome,
      cargo: `(${cargo})`,
      full: `${nome} (${cargo})`,
    };
  };

  const formatIp = (rawIp?: string) => {
    if (!rawIp || rawIp === '::1' || rawIp === '::ffff:127.0.0.1' || rawIp === '127.0.0.1') {
      return '192.168.1.1';
    }
    return String(rawIp).replace(/^::ffff:/, '');
  };

  // Garante listagem contínua e sequencial sem vãos/saltos de IDs
  const rowsSequenciais = filtered.map((a, idx) => ({
    ...a,
    seqId: filtered.length - idx,
  }));

  const exportarXlsx = () => {
    const dataHora = new Date().toISOString().slice(0, 10);
    // Ordem das informações solicitada: ID > USUÁRIO > COMPUTADOR > ENDEREÇO IP > DATA > HORA > ENTIDADE > DETALHES
    const headers = ['ID', 'USUÁRIO', 'COMPUTADOR', 'ENDEREÇO IP', 'DATA', 'HORA', 'ENTIDADE', 'DETALHES'];
    const rows = rowsSequenciais.map(a => [
      a.seqId || a.id,
      formatUsuarioDisplay(a.usuario).full,
      formatComputador(a),
      formatIp(a.ip),
      formatDate(a.data),
      a.hora || '—',
      a.acao || a.entidade || '',
      a.detalhes || '',
    ]);
    exportGridToXlsx(headers, rows, `urbania_auditoria_${dataHora}`);
    toast.success('Auditoria exportada com sucesso em planilha Excel (.xlsx).');
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto print:space-y-0 print:m-0 print:p-0 print:max-w-none">
      <PageHeader
        title="Auditoria"
        subtitle={`${filtered.length} logs de operações registradas`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition text-sm shadow-xs"
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button
              onClick={exportarXlsx}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-sm shadow-xs"
            >
              <FileSpreadsheet size={16} /> Exportar (.xlsx)
            </button>
          </div>
        }
      />

      <Card>
        <div className="no-print print:hidden">
          <Toolbar>
            <SearchInput
              value={term}
              onChange={setTerm}
              placeholder="Buscar por usuário, computador, entidade, IP, detalhes..."
            />

            <FilterSelect
              value={acaoFiltro}
              onChange={setAcaoFiltro}
              options={ACOES_AUDITORIA}
              placeholder="Todas as operações"
            />

            <FilterSelect
              value={periodoFiltro}
              onChange={setPeriodoFiltro}
              options={PERIODOS_AUDITORIA}
              placeholder="Todos os períodos"
            />
          </Toolbar>
        </div>

        {/* Grid com a ordem exata das colunas: ID > USUÁRIO > COMPUTADOR > ENDEREÇO IP > DATA > HORA > ENTIDADE > DETALHES */}
        <DataTable
          pageSize={30}
          rows={rowsSequenciais}
          loading={auditoria.loading}
          empty="Nenhum registro de auditoria encontrado."
          onRowClick={r => setSelecionado(r)}
          layoutFixed
          dense
          columns={[
            {
              key: 'id',
              label: 'ID',
              className: 'w-12 whitespace-nowrap text-left',
              render: r => <span className="font-mono text-slate-500 text-xs font-semibold whitespace-nowrap">#{r.seqId || r.id}</span>,
            },
            {
              key: 'usuario',
              label: 'USUÁRIO',
              className: 'w-36 lg:w-42 whitespace-nowrap text-left',
              render: r => {
                const u = formatUsuarioDisplay(r.usuario);
                return (
                  <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0 py-0.5" title={u.full}>
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <User size={12} />
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="font-semibold text-slate-800 text-xs truncate">
                        {u.nome}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal truncate">
                        {u.cargo}
                      </span>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'computador',
              label: 'COMPUTADOR',
              className: 'w-32 whitespace-nowrap text-left',
              render: r => {
                const comp = formatComputador(r);
                return (
                  <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0" title={comp}>
                    <Laptop size={14} className="text-teal-600 shrink-0" />
                    <span className="font-medium text-slate-700 text-xs bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap inline-block">
                      {comp}
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'ip',
              label: 'ENDEREÇO IP',
              className: 'w-28 whitespace-nowrap text-left',
              render: r => <span className="font-mono text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">{formatIp(r.ip)}</span>,
            },
            {
              key: 'data',
              label: 'DATA',
              className: 'w-24 whitespace-nowrap text-left',
              render: r => <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{formatDate(r.data)}</span>,
            },
            {
              key: 'hora',
              label: 'HORA',
              className: 'w-16 whitespace-nowrap text-left',
              render: r => <span className="text-xs font-mono text-slate-600 whitespace-nowrap">{r.hora || '—'}</span>,
            },
            {
              key: 'entidade',
              label: 'ENTIDADE',
              className: 'w-28 whitespace-nowrap text-left',
              render: r => (
                <div className="whitespace-nowrap" title={`${r.entidade || ''}${r.entidadeId ? ` (#${r.entidadeId})` : ''}`}>
                  <Badge className={`text-xs px-2.5 py-0.5 rounded-md font-semibold whitespace-nowrap inline-flex items-center ${
                    r.acao === 'Criação' || r.acao === 'Inclusão' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    r.acao === 'Exclusão' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {r.acao}
                  </Badge>
                </div>
              ),
            },
            {
              key: 'detalhes',
              label: 'DETALHES',
              className: 'text-slate-600 min-w-0 text-left',
              render: r => (
                <span className="text-xs text-slate-600 block truncate" title={r.detalhes}>
                  {r.detalhes}
                </span>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal de Detalhes com Título Exato: "Auditoria" */}
      {selecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 bg-[#0a2540] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-teal-400" />
                <h3 className="font-bold text-lg tracking-tight">Auditoria</h3>
              </div>
              <button
                onClick={() => setSelecionado(null)}
                className="text-slate-300 hover:text-white transition p-1 rounded-md hover:bg-white/10"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuário</p>
                  <p className="font-bold text-slate-800 mt-0.5">{formatUsuarioDisplay(selecionado.usuario).full}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Computador</p>
                  <p className="font-bold text-teal-700 mt-0.5 flex items-center gap-1.5">
                    <Laptop size={15} /> {formatComputador(selecionado)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID do Log</p>
                  <p className="font-mono text-slate-700 mt-0.5 font-semibold">#{selecionado.seqId || selecionado.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data e Hora</p>
                  <p className="text-slate-700 mt-0.5 font-medium">{formatDate(selecionado.data)} às {selecionado.hora || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Endereço IP</p>
                  <p className="font-mono text-slate-700 mt-0.5">{formatIp(selecionado.ip)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operação Realizada</p>
                  <div className="mt-0.5">
                    <Badge className={
                      selecionado.acao === 'Criação' || selecionado.acao === 'Inclusão' ? 'bg-emerald-100 text-emerald-800' :
                      selecionado.acao === 'Exclusão' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }>
                      {selecionado.acao}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entidade Afetada</p>
                <p className="font-mono text-slate-800 font-semibold mt-0.5">
                  {selecionado.entidade} {selecionado.entidadeId ? `(ID: #${selecionado.entidadeId})` : ''}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalhes da Ação</p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 mt-1 leading-relaxed">
                  {selecionado.detalhes || 'Sem detalhes adicionais.'}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelecionado(null)}
                className="px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-semibold hover:bg-[#071b2f] transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
