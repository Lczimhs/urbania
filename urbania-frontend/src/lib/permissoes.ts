// Ações da matriz de permissões (mesmos nomes usados no backend, em permissoes.js)
export type Acao = 'Visualizar' | 'Criar' | 'Editar' | 'Excluir';
export type Permissoes = Record<string, string[]>;

// Rotas cujo primeiro trecho é um módulo da matriz (ex.: /clientes/3/editar -> clientes).
// Rotas fora da lista (Painel, Avisos, Meu Perfil) são liberadas para qualquer usuário logado.
const MODULOS_COM_ROTA = [
  'clientes', 'proprietarios', 'imoveis', 'visitas', 'negociacoes', 'contratos',
  'financeiro', 'despesas', 'multas', 'relatorios', 'auditoria', 'notificacoes',
  'funcionarios', 'perfis', 'configuracoes', 'servicos', 'prestadores', 'reparos', 'canais', 'anuncios',
];

export const moduloDaRota = (path: string) => {
  const primeiro = path.split('/')[1] || '';
  return MODULOS_COM_ROTA.includes(primeiro) ? primeiro : null;
};

// Ação exigida por uma rota de CRUD: /x (consulta), /x/novo, /x/:id, /x/:id/editar
export const acaoDaRota = (path: string): Acao => {
  if (path.endsWith('/novo')) return 'Criar';
  if (path.endsWith('/editar')) return 'Editar';
  return 'Visualizar';
};
