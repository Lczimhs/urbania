import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  FileText,
  History,
  Lock,
  Percent,
  Plus,
  User,
  XCircle,
} from 'lucide-react';
import { api } from '../api';
import { Badge, Card, DataTable, FilterSelect, PageHeader, RowActions, SearchInput, Toolbar } from '../components/DataTable';
import type { Mode, TabDef } from '../components/EntityForm';
import { EntityPage, RelatedGrid } from '../components/EntityPage';
import { Modal } from '../components/Modal';
import { apiError, useToast } from '../components/Toast';
import { useDelete } from '../components/useDelete';
import { useList } from '../lib/useApi';
import { formatCurrency, formatDate, todayISO } from '../lib/format';
import {
  MODOS_VALOR_MULTA,
  STATUS_MULTA,
  TIPOS_MULTA,
  statusColor,
} from '../lib/options';
import { Pode, usePodeNaRota } from '../lib/auth';

// Parser para histórico de status (RF F3 NF 1.3)
interface StatusHistoryEntry {
  de: string | null;
  para: string;
  data: string;
  usuario: string;
  motivo?: string;
}

function parseHistorico(val: any): StatusHistoryEntry[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ==========================================
// 1. LISTAGEM DE MULTAS (RF F2)
// ==========================================
export function MultasList() {
  const pode = usePodeNaRota();
  const navigate = useNavigate();
  const toast = useToast();
  const { rows, setRows, loading, reload } = useList('multas');
  const contratos = useList('contratos');
  const [term, setTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalStatus, setModalStatus] = useState<{ multa: any; novoStatus: string } | null>(null);
  const [justificativa, setJustificativa] = useState('');

  const del = useDelete('multas', 'Multa Contratual', reload);

  // Filtra por Contrato ou por Inquilino (RF F2 NF 1.4)
  const filtered = rows.filter(r => {
    if (tipoFilter && r.tipo !== tipoFilter) return false;
    if (statusFilter && (r.status || 'Pendente') !== statusFilter) return false;
    if (!term) return true;
    const termClean = term.toLowerCase();
    const matchInquilino = (r.clienteNome || '').toLowerCase().includes(termClean);
    const matchContrato = String(r.contratoId || '').includes(termClean);
    const matchMotivo = (r.motivo || '').toLowerCase().includes(termClean);
    return matchInquilino || matchContrato || matchMotivo;
  });

  // Atualiza status e registra no histórico (RF F2 NF 1.5.3 / RF F3 NF 1.3)
  const handleUpdateStatus = async () => {
    if (!modalStatus) return;
    const { multa, novoStatus } = modalStatus;
    const statusAntigo = multa.status || 'Pendente';

    if (novoStatus === 'Cancelado' && !justificativa.trim()) {
      toast.error('Informe a justificativa para o cancelamento da multa.');
      return;
    }

    const historicoAtual = parseHistorico(multa.historicoStatus);
    const novoHistorico = [
      ...historicoAtual,
      {
        de: statusAntigo,
        para: novoStatus,
        data: new Date().toISOString().replace('T', ' ').slice(0, 16),
        usuario: 'Carlos Mendes (Operador)',
        motivo: justificativa || undefined,
      },
    ];

    try {
      await api.put(`/multas/${multa.id}`, {
        status: novoStatus,
        historicoStatus: JSON.stringify(novoHistorico),
      });
      setRows(prev =>
        prev.map(item =>
          item.id === multa.id
            ? { ...item, status: novoStatus, historicoStatus: JSON.stringify(novoHistorico) }
            : item
        )
      );
      toast.success(`Status da multa #${multa.id} alterado para "${novoStatus}".`);
      setModalStatus(null);
      setJustificativa('');
    } catch (err) {
      toast.error(apiError(err, 'Erro ao atualizar o status da multa.'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestão de Multas"
        subtitle={`${rows.length} penalidades contratuais registradas`}
        action={
          <Pode acao="Criar"><button
            onClick={() => navigate('/multas/novo')}
            className="flex items-center gap-2 bg-[#0a2540] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#06182c] shadow-sm transition"
          >
            <Plus size={18} /> Nova Multa
          </button></Pode>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={term}
            onChange={setTerm}
            placeholder="Buscar por contrato, inquilino ou motivo..."
          />
          <FilterSelect
            value={tipoFilter}
            onChange={v => setTipoFilter(v || '')}
            placeholder="Todos os tipos de multa"
            options={TIPOS_MULTA}
          />
          <FilterSelect
            value={statusFilter}
            onChange={v => setStatusFilter(v || '')}
            placeholder="Todos os status"
            options={STATUS_MULTA}
          />
        </Toolbar>

        <DataTable
          rows={filtered}
          loading={loading || contratos.loading}
          onRowClick={r => navigate(`/multas/${r.id}`)}
          columns={[
            {
              key: 'contrato',
              label: 'Contrato',
              render: r => (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText size={15} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">
                      Contrato #{r.contratoId}
                    </span>
                    <p className="text-[11px] text-slate-500">Locação Residencial</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'inquilino',
              label: 'Inquilino / Locatário',
              render: r => (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="font-medium text-slate-800">{r.clienteNome || 'Não informado'}</span>
                </div>
              ),
            },
            {
              key: 'tipo',
              label: 'Tipo de Multa',
              render: r => (
                <div>
                  <span className="font-medium text-slate-800">{r.tipo}</span>
                  {r.motivo && (
                    <p className="text-xs text-slate-500 line-clamp-1">{r.motivo}</p>
                  )}
                </div>
              ),
            },
            {
              key: 'valor',
              label: 'Valor / Percentual',
              render: r => {
                const isPct = r.modoValor === 'Percentual (%)' || (r.percentual && Number(r.percentual) > 0);
                return (
                  <div>
                    <p className="font-bold text-rose-700">
                      {formatCurrency(r.valor || r.valorCalculado || 0)}
                    </p>
                    {isPct && (
                      <p className="text-[11px] text-slate-500">
                        {r.percentual}% s/ aluguel
                      </p>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'vencimento',
              label: 'Vencimento',
              render: r => (
                <div className="text-xs text-slate-600">
                  <p className="font-medium">{formatDate(r.dataVencimento)}</p>
                  <p className="text-[11px] text-slate-400">Apl: {formatDate(r.dataAplicacao)}</p>
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: r => {
                const s = r.status || 'Pendente';
                return (
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <Badge className={statusColor(s)}>{s}</Badge>
                    {s === 'Pendente' && pode('Editar') && (
                      <button
                        type="button"
                        onClick={() => setModalStatus({ multa: r, novoStatus: 'Pago' })}
                        title="Marcar como Pago"
                        className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    {s === 'Pendente' && pode('Editar') && (
                      <button
                        type="button"
                        onClick={() => setModalStatus({ multa: r, novoStatus: 'Cancelado' })}
                        title="Cancelar multa mediante justificativa"
                        className="p-1 rounded hover:bg-rose-50 text-rose-500 transition"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                );
              },
            },
          ]}
          actions={r => (
            <RowActions
              onView={() => navigate(`/multas/${r.id}`)}
              onEdit={() => navigate(`/multas/${r.id}/editar`)}
              onDelete={
                r.status === 'Pago'
                  ? undefined // Impedir exclusão de multas já pagas (RF F2 NF 1.5.3)
                  : () => del.ask(r.id, `Multa #${r.id} (${r.tipo} - ${r.clienteNome})`)
              }
            />
          )}
        />
      </Card>

      {/* Modal de Alteração de Status com Justificativa */}
      {modalStatus && (
        <Modal
          title={`Alterar Status da Multa #${modalStatus.multa.id}`}
          onClose={() => {
            setModalStatus(null);
            setJustificativa('');
          }}
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Você está alterando o status da multa de{' '}
              <span className="font-bold text-slate-800">
                {modalStatus.multa.status || 'Pendente'}
              </span>{' '}
              para{' '}
              <span className="font-bold text-sky-700">
                {modalStatus.novoStatus}
              </span>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Justificativa / Observação do Operador{' '}
                {modalStatus.novoStatus === 'Cancelado' && (
                  <span className="text-rose-500">* (obrigatória)</span>
                )}
              </label>
              <textarea
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                placeholder="Informe o motivo da alteração de status para o registro de auditoria..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0a2540] h-24"
              />
            </div>

            <div className="pt-4 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalStatus(null);
                  setJustificativa('');
                }}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="save-action px-4 py-2 text-white rounded-lg font-semibold text-sm"
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </Modal>
      )}

      {del.modal}
    </div>
  );
}

// ==========================================
// 2. FORMULÁRIO DE CADASTRO / EDIÇÃO / VIEW (RF F1 / F3 / F4)
// ==========================================
export function MultaPage({ mode }: { mode: Mode }) {
  const loc = useLocation();
  const contratos = useList('contratos');
  const defaultContratoId = loc.state?.contratoId ? Number(loc.state.contratoId) : undefined;
  const initialContrato = contratos.rows.find(x => Number(x.id) === defaultContratoId);

  const tabs: TabDef[] = [
    {
      label: 'Dados da Multa',
      fields: [
        // RF F1 NF 1.1.2: ComboBox de contratos pesquisável com auto-fill de inquilino
        {
          key: 'contratoId',
          label: 'Contrato Vinculado',
          type: 'search-select',
          required: true,
          // RF F4 NF 1.3: O campo contrato não deve poder ser alterado após o cadastro
          disabled: (_, m) => m === 'edit',
          options: contratos.rows.map(ct => ({
            value: ct.id,
            label: `Contrato #${ct.id} - ${ct.imovelTitulo || 'Imóvel'} (${ct.clienteNome || 'Inquilino'})`,
            hint: `Aluguel Base: ${formatCurrency(ct.valor)} · Vcto Dia ${ct.diaVencimento || 10}`,
          })),
          onChange: (val, form) => {
            const ct = contratos.rows.find(x => Number(x.id) === Number(val));
            if (ct) {
              const updated: Record<string, any> = {
                ...form,
                contratoId: ct.id,
                clienteId: ct.clienteId,
                clienteNome: ct.clienteNome,
                valorAluguelBase: ct.valor || 0,
              };
              // Recalcula se o modo for percentual
              if (form.modoValor === 'Percentual (%)' && form.percentual) {
                const pct = Number(form.percentual || 0);
                const calc = (Number(ct.valor || 0) * pct) / 100;
                updated.valor = calc;
                updated.valorCalculado = calc;
              }
              return updated;
            }
          },
        },
        {
          key: 'clienteNome',
          label: 'Inquilino / Locatário Notificado',
          disabled: true,
          placeholder: 'Preenchido automaticamente ao selecionar o contrato',
        },
        // RF F1 NF 1.1.1: ComboBox de tipo de multa
        {
          key: 'tipo',
          label: 'Tipo de Multa / Penalidade',
          type: 'select',
          options: TIPOS_MULTA,
          required: true,
        },
        // RF F1 NF 1.1.3: Modo de valor Fixo ou Percentual
        {
          key: 'modoValor',
          label: 'Modalidade de Cálculo do Valor',
          type: 'select',
          options: MODOS_VALOR_MULTA,
          required: true,
          // RF F4 NF 1.5: Multas pagas ou canceladas não devem ter o valor editado
          disabled: (form, m) => m === 'edit' && (form.status === 'Pago' || form.status === 'Cancelado'),
          onChange: (val, form) => {
            if (val === 'Percentual (%)') {
              const ct = contratos.rows.find(x => Number(x.id) === Number(form.contratoId));
              const aluguel = Number(ct?.valor || form.valorAluguelBase || 0);
              const pct = Number(form.percentual || 2);
              const calc = (aluguel * pct) / 100;
              return {
                ...form,
                modoValor: val,
                percentual: pct,
                valor: calc,
                valorCalculado: calc,
              };
            }
            return { ...form, modoValor: val };
          },
        },
        {
          key: 'percentual',
          label: 'Percentual da Multa (%)',
          type: 'number',
          suffix: '%',
          placeholder: 'Ex: 2.0',
          hidden: form => form.modoValor !== 'Percentual (%)',
          // RF F4 NF 1.5: Multas pagas ou canceladas não têm valor editado
          disabled: (form, m) => m === 'edit' && (form.status === 'Pago' || form.status === 'Cancelado'),
          onChange: (val, form) => {
            const ct = contratos.rows.find(x => Number(x.id) === Number(form.contratoId));
            const aluguel = Number(ct?.valor || form.valorAluguelBase || 0);
            const calc = (aluguel * Number(val || 0)) / 100;
            return {
              ...form,
              percentual: val,
              valor: calc,
              valorCalculado: calc,
            };
          },
        },
        {
          key: 'valor',
          label: 'Valor da Multa (R$)',
          type: 'currency',
          placeholder: 'R$ 0,00',
          required: true,
          // Se for percentual, o valor é gerado automaticamente; se estiver paga ou cancelada, é bloqueado
          disabled: (form, m) =>
            form.modoValor === 'Percentual (%)' ||
            (m === 'edit' && (form.status === 'Pago' || form.status === 'Cancelado')),
        },
        {
          key: 'dataAplicacao',
          label: 'Data de Aplicação / Infração',
          type: 'date',
          required: true,
        },
        {
          key: 'dataVencimento',
          label: 'Data de Vencimento do Pagamento',
          type: 'date',
          required: true,
        },
        // RF F1 NF 1.1.4: Motivo de texto livre, obrigatório se tipo for "Outros"
        {
          key: 'motivo',
          label: 'Motivo e Justificativa da Penalidade',
          type: 'textarea',
          full: true,
          required: form => form.tipo === 'Outros',
          placeholder: 'Descreva a ocorrência, cláusula violada ou circunstância do dano / atraso...',
        },
        // RF F4: Na edição permite ajustar o status
        {
          key: 'status',
          label: 'Situação / Status Atual',
          type: 'select',
          options: STATUS_MULTA,
          hidden: () => mode === 'create', // RF F1 NF 1.5: No cadastro inicia sempre como Pendente
        },
      ],
      render: (form, currentMode) => {
        const isPaidOrCancelled = form.status === 'Pago' || form.status === 'Cancelado';
        const ct = contratos.rows.find(x => Number(x.id) === Number(form.contratoId));

        return (
          <div className="space-y-4">
            {/* Aviso de bloqueio para multas quitadas ou canceladas (RF F4 NF 1.5) */}
            {currentMode === 'edit' && isPaidOrCancelled && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800">
                <Lock size={18} className="text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">Multa {form.status} — Valores protegidos contra alteração</p>
                  <p className="text-amber-700">
                    Conforme as diretrizes de confiabilidade (RF F4 NF 1.5), multas quitadas ou canceladas não permitem a modificação do valor original.
                  </p>
                </div>
              </div>
            )}

            {/* Painel Informativo sobre o Cálculo */}
            {form.modoValor === 'Percentual (%)' && (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3 text-xs text-sky-900">
                <Percent size={18} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cálculo Automático sobre o Aluguel Contratual</p>
                  <p className="text-sky-700 mt-0.5">
                    Valor base do aluguel: <span className="font-semibold">{formatCurrency(ct?.valor || form.valorAluguelBase || 0)}</span> · Multa de{' '}
                    <span className="font-semibold">{form.percentual || 0}%</span> ={' '}
                    <span className="font-bold text-rose-700">{formatCurrency(form.valor || 0)}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  // RF F3 NF 1.3: Aba com o Histórico de mudanças de status
  const extraTabs: TabDef[] = mode !== 'create' ? [
    {
      label: 'Histórico de Status',
      render: form => {
        const historico = parseHistorico(form.historicoStatus);

        return (
          <RelatedGrid title="Linha do Tempo e Mudanças de Status (RF F3 NF 1.3)">
            {historico.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Nenhuma alteração de status registrada até o momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {historico.map((h, i) => (
                  <div key={i} className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <History size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {h.de ? `${h.de} →` : 'Status Inicial:'}
                          </span>
                          <Badge className={statusColor(h.para)}>{h.para}</Badge>
                        </div>
                        {h.motivo && (
                          <p className="text-xs text-slate-600 mt-1 italic">&quot;{h.motivo}&quot;</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Operador: <span className="font-medium text-slate-600">{h.usuario}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{h.data}</span>
                  </div>
                ))}
              </div>
            )}
          </RelatedGrid>
        );
      },
    },
  ] : [];

  return (
    <EntityPage
      mode={mode}
      entity="multas"
      basePath="/multas"
      singular="Multa"
      tabs={tabs}
      extraTabs={extraTabs}
      defaults={{
        contratoId: defaultContratoId,
        clienteId: initialContrato?.clienteId,
        clienteNome: initialContrato?.clienteNome,
        valorAluguelBase: initialContrato?.valor || 0,
        tipo: 'Atraso no pagamento',
        modoValor: 'Fixo (R$)',
        dataAplicacao: todayISO(),
        dataVencimento: todayISO(),
        status: 'Pendente',
      }}
      editLabel="Editar Multa"
      cancelConfirm={mode === 'edit' ? 'Deseja descartar as alterações na multa?' : undefined}
      validate={f => {
        if (!f.contratoId) return 'Selecione o contrato vinculado à multa.';
        if (!f.tipo) return 'Informe o tipo de multa.';
        if (f.tipo === 'Outros' && (!f.motivo || !String(f.motivo).trim())) {
          return 'O motivo é obrigatório quando o tipo de multa for "Outros".';
        }
        if (!f.valor || Number(f.valor) <= 0) {
          return 'Informe um valor válido e maior que zero para a multa.';
        }
        if (!f.dataAplicacao) return 'A data de aplicação é obrigatória.';
        if (!f.dataVencimento) return 'A data de vencimento é obrigatória.';
        return null;
      }}
      prepare={(f, currentMode) => {
        const ct = contratos.rows.find(x => Number(x.id) === Number(f.contratoId));
        const val = Number(f.valor || 0);

        // Ao criar, inicializa o histórico com a entrada de criação
        let historico = parseHistorico(f.historicoStatus);
        if (currentMode === 'create' && historico.length === 0) {
          historico = [
            {
              de: null,
              para: 'Pendente',
              data: new Date().toISOString().replace('T', ' ').slice(0, 16),
              usuario: 'Carlos Mendes (Operador)',
              motivo: 'Cadastro inicial da penalidade',
            },
          ];
        }

        return {
          ...f,
          contratoId: Number(f.contratoId),
          clienteId: ct?.clienteId ?? f.clienteId ?? null,
          clienteNome: ct?.clienteNome ?? f.clienteNome ?? null,
          valor: val,
          percentual: f.modoValor === 'Percentual (%)' ? Number(f.percentual || 0) : null,
          valorCalculado: val,
          status: currentMode === 'create' ? 'Pendente' : (f.status || 'Pendente'),
          historicoStatus: JSON.stringify(historico),
        };
      }}
    />
  );
}
