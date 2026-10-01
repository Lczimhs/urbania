const db = require('./database');

// Ações da matriz de permissões (tela Perfis de Acesso)
const ACOES = ['Visualizar', 'Criar', 'Editar', 'Excluir'];
const ACAO_POR_METODO = { GET: 'Visualizar', POST: 'Criar', PUT: 'Editar', DELETE: 'Excluir' };

// Módulos da matriz. Cada tabela da API pertence ao módulo de mesmo nome.
const MODULOS = [
  'clientes', 'proprietarios', 'imoveis', 'visitas', 'negociacoes', 'contratos',
  'financeiro', 'despesas', 'multas', 'relatorios', 'auditoria', 'notificacoes',
  'funcionarios', 'perfis', 'configuracoes', 'servicos', 'prestadores', 'reparos', 'canais', 'anuncios',
];

// Leitura de apoio: telas de um módulo precisam listar dados de outros
// (ex.: o cadastro de visita lista clientes, imóveis e corretores).
// Quem pode visualizar o módulo da direita também pode LER a tabela da esquerda.
const LEITURA_DE_APOIO = {
  clientes: ['visitas', 'negociacoes', 'contratos', 'financeiro', 'multas', 'imoveis'],
  proprietarios: ['imoveis', 'negociacoes', 'contratos', 'financeiro', 'anuncios', 'relatorios'],
  imoveis: ['clientes', 'proprietarios', 'visitas', 'negociacoes', 'contratos', 'financeiro', 'despesas', 'reparos', 'anuncios', 'relatorios', 'funcionarios'],
  funcionarios: ['visitas', 'negociacoes', 'contratos', 'imoveis', 'reparos', 'anuncios', 'relatorios', 'perfis'],
  contratos: ['clientes', 'proprietarios', 'imoveis', 'financeiro', 'multas'],
  visitas: ['clientes', 'imoveis', 'funcionarios'],
  negociacoes: ['clientes', 'proprietarios', 'imoveis', 'relatorios'],
  multas: ['contratos'],
  financeiro: ['relatorios'],
  reparos: ['relatorios'],
  servicos: ['prestadores', 'reparos'],
  prestadores: ['reparos'],
  canais: ['anuncios'],
  perfis: ['funcionarios'],
};

// Colunas de funcionários que podem ser vistas por quem não administra a equipe
const FUNCIONARIO_PUBLICO = ['id', 'nome', 'cargo', 'creci', 'email', 'telefone', 'foto', 'status'];

// ===== Sessão (protótipo acadêmico) =====
// O "token" é apenas o id do funcionário logado: serve para o backend saber
// qual perfil usar. Não há senha nem validade, por decisão do projeto.
const gerarToken = userId => String(userId);
const lerToken = token => Number(token) || null;

// ===== Permissões =====
const get = (sql, params = []) => new Promise((resolve, reject) =>
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

const run = (sql, params = []) => new Promise((resolve, reject) =>
  db.run(sql, params, function(err) { return err ? reject(err) : resolve(this); }));

const todas = () => Object.fromEntries(MODULOS.map(m => [m, [...ACOES]]));

const ehAdministrador = perfil => perfil && Number(perfil.nativo) === 1 && perfil.nome === 'Administrador';

// Permissões efetivas do usuário: o perfil Administrador nativo sempre tem tudo
// (evita que o sistema fique sem ninguém capaz de gerenciar os perfis).
const permissoesDoPerfil = perfil => {
  if (!perfil || (perfil.status && perfil.status !== 'Ativo')) return {};
  if (ehAdministrador(perfil)) return todas();
  try {
    const p = JSON.parse(perfil.permissoes || '{}');
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
};

const pode = (permissoes, modulo, acao) => (permissoes[modulo] || []).includes(acao);

const podeLer = (permissoes, tabela) =>
  pode(permissoes, tabela, 'Visualizar') || (LEITURA_DE_APOIO[tabela] || []).some(m => pode(permissoes, m, 'Visualizar'));

// Carrega usuário + perfil a cada requisição: mudanças de perfil valem na hora
// Funcionário sem perfil (ou com perfil inativo) usa as permissões do Visitante.
const carregarSessao = async userId => {
  const user = await get('SELECT * FROM funcionarios WHERE id = ?', [userId]);
  if (!user) return null;
  let perfil = user.perfilId ? await get('SELECT * FROM perfis WHERE id = ?', [user.perfilId]) : null;
  if (!perfil || (perfil.status && perfil.status !== 'Ativo')) perfil = await get("SELECT * FROM perfis WHERE nome = 'Visitante'");
  const { senha: _, ...semSenha } = user;
  return { user: { ...semSenha, perfilNome: perfil?.nome || null }, permissoes: permissoesDoPerfil(perfil) };
};

// Middleware: exige o id do usuário logado em todas as rotas /api (menos o login)
const autenticar = async (req, res, next) => {
  if (req.path === '/api/auth/login' || !req.path.startsWith('/api/')) return next();
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const userId = lerToken(token);
  if (!userId) return res.status(401).json({ error: 'Faça login para acessar o sistema.' });
  try {
    const sessao = await carregarSessao(userId);
    if (!sessao) return res.status(401).json({ error: 'Usuário não encontrado. Faça login novamente.' });
    req.sessao = sessao;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Middleware das rotas de CRUD: confere a ação do método HTTP no módulo da tabela
const autorizar = tabela => (req, res, next) => {
  const acao = ACAO_POR_METODO[req.method];
  const { permissoes } = req.sessao;
  // Todos leem as configurações (nome e logo da imobiliária aparecem no cabeçalho)
  const permitido = acao === 'Visualizar'
    ? tabela === 'configuracoes' || podeLer(permissoes, tabela)
    // Configurações é um registro único: salvar pela primeira vez também é "Editar"
    : pode(permissoes, tabela, tabela === 'configuracoes' ? 'Editar' : acao);
  if (permitido) return next();
  res.status(403).json({ error: `Acesso negado: seu perfil não tem permissão para ${acao.toLowerCase()} em "${tabela}".` });
};

// Esconde senha (sempre) e dados pessoais/salário (para quem não administra a equipe)
const filtrarFuncionario = (row, permissoes) => {
  if (!row) return row;
  const { senha: _, ...semSenha } = row;
  if (pode(permissoes, 'funcionarios', 'Visualizar')) return semSenha;
  return Object.fromEntries(FUNCIONARIO_PUBLICO.map(k => [k, row[k]]));
};

// Garante que os perfis/usuários usados no acesso rápido existam em qualquer banco
// (inclusive bancos antigos dos colegas, criados antes desta versão).
const PERMISSOES_VISITANTE = Object.fromEntries(
  ['clientes', 'proprietarios', 'imoveis', 'visitas', 'negociacoes', 'contratos', 'financeiro', 'despesas',
    'multas', 'relatorios', 'servicos', 'prestadores', 'reparos', 'canais', 'anuncios'].map(m => [m, ['Visualizar']])
);

const garantirAcessosPadrao = async () => {
  // Banco ainda vazio: quem cria os perfis é o seed.js (que chama esta função ao final)
  if ((await get('SELECT COUNT(*) as c FROM perfis')).c === 0) return;
  let visitante = await get("SELECT id FROM perfis WHERE nome = 'Visitante'");
  if (!visitante) {
    const r = await run(
      "INSERT INTO perfis (nome, descricao, permissoes, status, nativo) VALUES ('Visitante', ?, ?, 'Ativo', 1)",
      ['Somente leitura: visualiza os módulos operacionais e financeiros, sem acesso à administração e sem alterar dados.', JSON.stringify(PERMISSOES_VISITANTE)]
    );
    visitante = { id: r.lastID };
  }
  const usuario = await get("SELECT id FROM funcionarios WHERE LOWER(email) = 'visitante@urbania.com.br'");
  if (!usuario) {
    await run(
      "INSERT INTO funcionarios (nome, email, senha, cargo, status, perfilId) VALUES ('Visitante', 'visitante@urbania.com.br', 'visitante123', 'Visitante', 'Ativo', ?)",
      [visitante.id]
    );
  }
};

// Id do usuário Visitante (usado quando o e-mail digitado não é de nenhum funcionário)
const idVisitante = async () => {
  await garantirAcessosPadrao();
  const v = await get("SELECT id FROM funcionarios WHERE LOWER(email) = 'visitante@urbania.com.br'");
  return v?.id;
};

module.exports = {
  idVisitante, ACOES, MODULOS, gerarToken, carregarSessao, autenticar, autorizar, filtrarFuncionario, garantirAcessosPadrao,
};
