import { useCallback, useState } from 'react';
import { useList } from './useApi';
import { formatCurrency, formatDate, todayISO } from './format';
import { parsePhotos } from './files';

export type Alerta = {
  id: string;            // estável, para lembrar se já foi lido
  tom: 'info' | 'aviso' | 'urgente';
  titulo: string;
  descricao: string;
  data: string;          // data de referência (AAAA-MM-DD), usada no "há 2 dias" / "em 3 dias"
  link: string;
  acao?: string;         // texto do atalho, ex.: "Clique para ajustar"
};

const DIA = 86_400_000;
const diasEntre = (de: string, ate: string) => Math.round((Date.parse(ate) - Date.parse(de)) / DIA);

// "hoje", "ontem", "há 3 dias", "amanhã", "em 5 dias"
export const tempoRelativo = (data: string) => {
  if (!data) return '';
  const d = diasEntre(todayISO(), data.slice(0, 10));
  if (d === 0) return 'hoje';
  if (d === -1) return 'ontem';
  if (d === 1) return 'amanhã';
  if (d < 0) return d > -30 ? `há ${-d} dias` : `desde ${formatDate(data)}`;
  return d < 30 ? `em ${d} dias` : formatDate(data);
};

const LIDAS_KEY = 'urbania_notificacoes_lidas';
const lerLidas = (): string[] => {
  try { return JSON.parse(localStorage.getItem(LIDAS_KEY) || '[]'); } catch { return []; }
};

// Avisos gerados a partir dos dados do sistema (visitas, vencimentos, contratos, imóveis...)
export function useAlertas() {
  const visitas = useList('visitas');
  const despesas = useList('despesas');
  const multas = useList('multas');
  const financeiro = useList('financeiro');
  const contratos = useList('contratos');
  const imoveis = useList('imoveis');
  const reparos = useList('reparos');
  const [lidas, setLidas] = useState<string[]>(lerLidas);

  const hoje = todayISO();
  const listas = [visitas, despesas, multas, financeiro, contratos, imoveis, reparos];
  const loading = listas.some(l => l.loading);
  const recarregar = () => listas.forEach(l => l.reload());
  const alertas: Alerta[] = [];
  const aberto = (status: unknown) => !['Pago', 'Cancelado', 'Cancelada', 'Finalizado', 'Realizada'].includes(String(status));

  visitas.rows.forEach(v => {
    if (!v.data || !['Pendente', 'Confirmada'].includes(v.status)) return;
    const d = diasEntre(hoje, v.data);
    const quem = [v.clienteNome, v.imovelTitulo].filter(Boolean).join(' • ');
    if (d === 0) alertas.push({ id: `visita-${v.id}-hoje`, tom: 'urgente', titulo: `Visita hoje${v.hora ? ` às ${v.hora}` : ''}`, descricao: quem, data: v.data, link: `/visitas/${v.id}` });
    else if (d === 1) alertas.push({ id: `visita-${v.id}-amanha`, tom: 'info', titulo: `Visita amanhã${v.hora ? ` às ${v.hora}` : ''}`, descricao: quem, data: v.data, link: `/visitas/${v.id}` });
    else if (d < 0) alertas.push({ id: `visita-${v.id}-pendente`, tom: 'aviso', titulo: 'Visita passada sem atualização', descricao: `${quem} • ainda está como ${v.status}`, data: v.data, link: `/visitas/${v.id}/editar`, acao: 'Atualizar status' });
  });

  despesas.rows.forEach(x => {
    if (!x.dataVencimento || !aberto(x.status)) return;
    const d = diasEntre(hoje, x.dataVencimento);
    const desc = `${x.categoria || 'Despesa'} • ${formatCurrency(x.valor)}${x.descricao ? ` • ${x.descricao}` : ''}`;
    if (d < 0) alertas.push({ id: `despesa-${x.id}-atrasada`, tom: 'urgente', titulo: 'Despesa em atraso', descricao: desc, data: x.dataVencimento, link: `/despesas/${x.id}` });
    else if (d <= 3) alertas.push({ id: `despesa-${x.id}-vence`, tom: 'aviso', titulo: d === 0 ? 'Despesa vence hoje' : `Despesa vence em ${d} dia(s)`, descricao: desc, data: x.dataVencimento, link: `/despesas/${x.id}` });
  });

  financeiro.rows.forEach(f => {
    if (!aberto(f.status)) return;
    if (f.tipo === 'Repasse') {
      alertas.push({ id: `repasse-${f.id}`, tom: 'aviso', titulo: 'Repasse pendente ao proprietário', descricao: `${f.proprietarioNome || 'Proprietário'} • ${formatCurrency(f.valor)}`, data: f.dataVencimento || f.data || hoje, link: `/financeiro/${f.id}`, acao: 'Efetuar repasse' });
    } else if (f.tipo === 'Receita' && f.dataVencimento && f.dataVencimento < hoje) {
      alertas.push({ id: `receita-${f.id}-atrasada`, tom: 'urgente', titulo: 'Recebimento em atraso', descricao: `${f.clienteNome || f.descricao || 'Receita'} • ${formatCurrency(f.valor)}`, data: f.dataVencimento, link: `/financeiro/${f.id}` });
    }
  });

  multas.rows.forEach(m => {
    if (m.status !== 'Pendente' || !m.dataVencimento || m.dataVencimento >= hoje) return;
    alertas.push({ id: `multa-${m.id}-vencida`, tom: 'aviso', titulo: 'Multa vencida sem pagamento', descricao: `${m.clienteNome || 'Inquilino'} • ${m.tipo || 'Multa'} • ${formatCurrency(m.valorCalculado ?? m.valor)}`, data: m.dataVencimento, link: `/multas/${m.id}` });
  });

  contratos.rows.forEach(c => {
    if (c.status !== 'Ativo' || !c.dataFim) return;
    const d = diasEntre(hoje, c.dataFim);
    const desc = `${c.tipo || 'Contrato'} #${c.id} • ${[c.clienteNome, c.imovelTitulo].filter(Boolean).join(' • ')}`;
    if (d < 0) alertas.push({ id: `contrato-${c.id}-vencido`, tom: 'urgente', titulo: 'Contrato vencido ainda ativo', descricao: desc, data: c.dataFim, link: `/contratos/${c.id}`, acao: 'Renovar ou encerrar' });
    else if (d <= 30) alertas.push({ id: `contrato-${c.id}-vence`, tom: 'aviso', titulo: `Contrato vence em ${d} dia(s)`, descricao: desc, data: c.dataFim, link: `/contratos/${c.id}` });
  });

  imoveis.rows.forEach(i => {
    if (parsePhotos(i.fotos).length) return;
    alertas.push({ id: `imovel-${i.id}-sem-foto`, tom: 'info', titulo: 'Imóvel sem fotos', descricao: `${i.titulo || 'Imóvel'} • Código: #${i.id} • anúncios sem foto atraem menos interessados`, data: hoje, link: `/imoveis/${i.id}/editar`, acao: 'Clique para ajustar' });
  });

  reparos.rows.forEach(r => {
    if (r.status !== 'Pendente') return;
    alertas.push({ id: `reparo-${r.id}-pendente`, tom: 'info', titulo: 'Reparo aguardando início', descricao: `${r.descricao || 'Reparo'}${r.responsavel ? ` • ${r.responsavel}` : ''}`, data: r.dataSolicitacao || hoje, link: `/reparos/${r.id}` });
  });

  // Mais urgentes primeiro; dentro do mesmo nível, os mais próximos de hoje
  const peso = { urgente: 0, aviso: 1, info: 2 };
  alertas.sort((a, b) => peso[a.tom] - peso[b.tom] || Math.abs(diasEntre(hoje, a.data)) - Math.abs(diasEntre(hoje, b.data)));

  const salvar = (ids: string[]) => {
    setLidas(ids);
    try { localStorage.setItem(LIDAS_KEY, JSON.stringify(ids)); } catch { /* sem armazenamento */ }
  };
  const marcarLida = useCallback((id: string) => salvar([...new Set([...lerLidas(), id])]), []);
  const marcarTodas = () => salvar([...new Set([...lidas, ...alertas.map(a => a.id)])]);

  const naoLidas = alertas.filter(a => !lidas.includes(a.id)).length;
  return { alertas, loading, lidas, naoLidas, marcarLida, marcarTodas, recarregar };
}
