import type { FieldDef } from '../components/EntityForm';
import { maskCep } from './masks';

// Opções dos ComboBox, conforme o Documento de Requisitos
export const TIPOS_CLIENTE = ['Comprador', 'Locatário', 'Interessado'];
export const ORIGENS_CLIENTE = ['Site', 'Indicação', 'Redes Sociais', 'Telefone'];
export const FINALIDADES_BUSCA = ['Compra', 'Locação', 'Todos'];
export const TIPOS_IMOVEL_BUSCA = ['Apartamento', 'Casa', 'Sobrado', 'Cobertura', 'Chácara', 'Sala Comercial'];
export const TIPOS_IMOVEL = ['Apartamento', 'Casa', 'Cobertura', 'Studio', 'Kitnet', 'Chácara', 'Sala Comercial'];
export const FINALIDADES_IMOVEL = ['Venda', 'Aluguel', 'Venda e Aluguel', 'Temporada'];
export const TIPOS_PESSOA = ['Física', 'Jurídica'];
export const TIPOS_CONTA = ['Corrente', 'Poupança'];
export const SEXOS = ['Masculino', 'Feminino', 'Outro'];
export const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];
export const STATUS_VISITA = ['Pendente', 'Confirmada', 'Realizada', 'Cancelada'];
export const STATUS_NEGOCIACAO = ['Em Andamento', 'Realizada', 'Cancelada'];
export const TIPOS_NEGOCIACAO = ['Venda', 'Locação', 'Temporada'];
export const FORMAS_PAGAMENTO = [
  'À Vista (PIX / Transferência)',
  'Financiamento Bancário',
  'Parcelamento Direto com Proprietário',
  'Carta de Crédito / Consórcio',
  'Permuta Parcial',
  'Outro',
];
export const CARGOS = ['Corretor', 'Secretária', 'Gerente', 'Financeiro', 'Administrador'];
export const STATUS_FUNCIONARIO = ['Ativo', 'Inativo'];
export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Campos de endereço usados em várias telas. O CEP preenche o restante automaticamente.
export const addressFields = (required = false): FieldDef[] => [
  { key: 'cep', label: 'CEP', mask: maskCep, placeholder: '00000-000', cep: true, required },
  { key: 'logradouro', label: 'Logradouro', required },
  { key: 'numero', label: 'Número', required },
  { key: 'complemento', label: 'Complemento' },
  { key: 'bairro', label: 'Bairro', required },
  { key: 'cidade', label: 'Cidade', required },
  { key: 'uf', label: 'Estado', type: 'select', options: UFS, required },
];

// Cores das etiquetas de status
export const statusColor = (status: unknown) => ({
  Pendente: 'bg-amber-100 text-amber-700',
  Confirmada: 'bg-emerald-100 text-emerald-700',
  Realizada: 'bg-slate-200 text-slate-700',
  Cancelada: 'bg-red-100 text-red-700',
  Ativo: 'bg-emerald-100 text-emerald-700',
  Inativo: 'bg-red-100 text-red-700',
  'Em Andamento': 'bg-sky-100 text-sky-700',
}[String(status)] || 'bg-slate-100 text-slate-600');
