import { useNavigate } from 'react-router-dom';
import { FlaskConical, GraduationCap, Info, Users } from 'lucide-react';
import { EntityForm } from '../components/EntityForm';
import type { TabDef } from '../components/EntityForm';
import { apiError, useToast } from '../components/Toast';
import { useConfig } from '../lib/config';
import { MODO_TESTE, useAuth } from '../lib/auth';
import { maskCnpj, maskPhone, onlyDigits } from '../lib/masks';
import logoPadrao from '../assets/logo.png';
import { INDICES_REAJUSTE, addressFields } from '../lib/options';

const EQUIPE = ['Enzo Prado Barbosa (Scrum Master)', 'Gustavo Alves Soares', 'Yuri Gabriel Ferreira', 'Lucas Vilas Boas Brito', 'Lucas Oliveira Nascimento', 'Felipe Barbosa Nink'];

const percentuais = ['taxaAdministracao', 'comissaoVenda', 'multaAtraso', 'jurosDia'];

const tabs: TabDef[] = [
  { label: 'Dados da Imobiliária', fields: [
    { key: 'logo', label: 'Logo da Imobiliária', type: 'photo', full: true, defaultPhoto: logoPadrao },
    { key: 'nomeFantasia', label: 'Nome Fantasia', required: true },
    { key: 'razaoSocial', label: 'Razão Social' },
    { key: 'cnpj', label: 'CNPJ', mask: maskCnpj, placeholder: '00.000.000/0000-00' },
    { key: 'creci', label: 'CRECI Jurídico', placeholder: 'Ex.: 1234-J' },
    { key: 'telefone', label: 'Telefone', mask: maskPhone, placeholder: '(00) 00000-0000' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'site', label: 'Site', placeholder: 'https://' },
  ] },
  { label: 'Endereço', fields: addressFields() },
  { label: 'Parâmetros Financeiros', fields: [
    { key: 'taxaAdministracao', label: 'Taxa de Administração (aluguel)', type: 'number', suffix: '%', required: true },
    { key: 'comissaoVenda', label: 'Comissão de Venda', type: 'number', suffix: '%', required: true },
    { key: 'multaAtraso', label: 'Multa por Atraso', type: 'number', suffix: '%' },
    { key: 'jurosDia', label: 'Juros por Dia de Atraso', type: 'number', suffix: '%' },
    { key: 'diaVencimento', label: 'Dia de Vencimento Padrão do Aluguel', type: 'number', placeholder: '1 a 28' },
    { key: 'prazoRepasse', label: 'Prazo de Repasse ao Proprietário', type: 'number', suffix: 'dias' },
    { key: 'indiceReajuste', label: 'Índice de Reajuste Padrão', type: 'select', options: INDICES_REAJUSTE },
  ] },
  { label: 'Sobre o Sistema', render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border rounded-xl p-5">
        <p className="flex items-center gap-2 font-bold text-slate-800"><Info size={18} className="text-sky-600" /> Urbânia</p>
        <p className="text-sm text-slate-600 mt-2">Sistema de gestão para compra, venda e aluguel de imóveis, com controle de visitas, negociações, contratos e repasses.</p>
        <p className="text-xs text-slate-400 mt-3">Versão 2026.1</p>
      </div>
      <div className={`border rounded-xl p-5 ${MODO_TESTE ? 'bg-teal-50 border-teal-200' : 'bg-white'}`}>
        <p className="flex items-center gap-2 font-bold text-slate-800"><FlaskConical size={18} className="text-teal-600" /> Modo de testes {MODO_TESTE ? 'ativado' : 'desativado'}</p>
        <p className="text-sm text-slate-600 mt-2">
          O e-mail de um funcionário entra com o perfil dele (a senha não é conferida); outro e-mail entra como Visitante. Cada tela respeita o perfil de acesso.
          {MODO_TESTE && ' Os botões de acesso rápido do login podem ser removidos alterando MODO_TESTE para false em src/lib/auth.tsx.'}
        </p>
      </div>
      <div className="bg-white border rounded-xl p-5">
        <p className="flex items-center gap-2 font-bold text-slate-800"><GraduationCap size={18} className="text-sky-600" /> Projeto acadêmico</p>
        <p className="text-sm text-slate-600 mt-2">Engenharia de Software · Análise e Desenvolvimento de Sistemas · IFRO Campus Ji-Paraná, 2026.</p>
        <p className="text-sm text-slate-600 mt-1">Orientação: Prof. Dr. Jackson Henrique da Silva Bezerra.</p>
      </div>
      <div className="bg-white border rounded-xl p-5">
        <p className="flex items-center gap-2 font-bold text-slate-800"><Users size={18} className="text-sky-600" /> Equipe FrontDev's</p>
        <ul className="text-sm text-slate-600 mt-2 space-y-0.5">{EQUIPE.map(n => <li key={n}>{n}</li>)}</ul>
      </div>
    </div>
  ) },
];

export default function Configuracoes() {
  const navigate = useNavigate();
  const toast = useToast();
  const { config, loading, salvar } = useConfig();
  const { pode } = useAuth();

  if (loading) return <p className="text-slate-400 p-8">Carregando...</p>;

  return (
    <EntityForm
      key={config.id ?? 'novo'}
      title="Configurações"
      mode={pode('configuracoes', 'Editar') ? 'edit' : 'view'}
      hideId
      initial={config}
      tabs={tabs}
      onBack={() => navigate('/')}
      validate={f => {
        const fora = percentuais.find(k => f[k] !== null && f[k] !== undefined && f[k] !== '' && (Number(f[k]) < 0 || Number(f[k]) > 100));
        if (fora) return 'Os percentuais devem estar entre 0 e 100.';
        const dia = Number(f.diaVencimento);
        if (f.diaVencimento && (!Number.isInteger(dia) || dia < 1 || dia > 28)) return 'O dia de vencimento deve ser entre 1 e 28.';
        if (f.cnpj && onlyDigits(f.cnpj).length !== 14) return 'CNPJ inválido: informe os 14 dígitos.';
        return null;
      }}
      onSubmit={async f => {
        try {
          await salvar(f);
          toast.success('Configurações salvas com sucesso!');
        } catch (err) {
          toast.error(apiError(err, 'Erro ao salvar as configurações.'));
        }
      }}
    />
  );
}
