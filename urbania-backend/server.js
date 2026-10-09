const express = require('express');
const cors = require('cors');
const db = require('./database');
const popularDadosDeTeste = require('./dados-teste');
const { idVisitante, gerarToken, carregarSessao, autenticar, autorizar, filtrarFuncionario, garantirAcessosPadrao } = require('./permissoes');

const app = express();
app.use(cors());
// Limite maior porque fotos são enviadas junto com o cadastro
app.use(express.json({ limit: '25mb' }));
// Toda rota /api (exceto o login) exige um token válido
app.use(autenticar);

const tables = Object.keys(db.schema);

// Só aceita campos que existem na tabela (evita erro de SQL e injeção pelo nome da coluna)
const pickColumns = (table, body) => {
  const columns = db.schema[table];
  const data = {};
  Object.keys(body || {}).forEach(k => {
    if (k in columns) data[k] = body[k] === '' ? null : body[k];
  });
  return data;
};

// Registros que impedem a exclusão (requisitos 1.5.4 / 1.5.3 / 1.7.1)
const deleteGuards = {
  clientes: [['visitas', 'clienteId', 'visita(s)'], ['negociacoes', 'clienteId', 'negociação(ões)'], ['contratos', 'clienteId', 'contrato(s)']],
  proprietarios: [['imoveis', 'proprietarioId', 'imóvel(is)'], ['negociacoes', 'proprietarioId', 'negociação(ões)'], ['contratos', 'proprietarioId', 'contrato(s)']],
  imoveis: [['visitas', 'imovelId', 'visita(s)'], ['negociacoes', 'imovelId', 'negociação(ões)'], ['contratos', 'imovelId', 'contrato(s)']],
  funcionarios: [['visitas', 'corretorId', 'visita(s)'], ['negociacoes', 'corretorId', 'negociação(ões)'], ['imoveis', 'responsavelId', 'imóvel(is)'], ['contratos', 'corretorId', 'contrato(s)']],
  contratos: [['multas', 'contratoId', 'multa(s)']],
  despesas: [['despesas', 'id', 'despesa(s) já paga(s) (permitido apenas cancelamento)', "id = ? AND status = 'Pago'"]],
  multas: [['multas', 'id', 'multa(s) já paga(s) (permitido apenas cancelamento)', "id = ? AND status = 'Pago'"]],
  perfis: [['funcionarios', 'perfilId', 'usuário(s) vinculado(s)'], ['perfis', 'id', 'perfil nativo do sistema (não pode ser excluído)', "id = ? AND nativo = 1"]],
  financeiro: [['financeiro', 'id', 'operação(ões) já quitada(s)/paga(s)', "id = ? AND status = 'Pago'"]],
  // 4º item opcional: condição própria (prestadores.servicos é uma lista JSON de ids)
  servicos: [['reparos', 'servicoId', 'reparo(s)'], ['prestadores', 'servicos', 'prestador(es)', 'EXISTS (SELECT 1 FROM json_each(servicos) WHERE value = CAST(? AS INTEGER))']],
  prestadores: [['reparos', 'prestadorId', 'reparo(s)']],
  canais: [['anuncios', 'canalId', 'anúncio(s)']],
};

const get = (sql, params = []) => new Promise((resolve, reject) =>
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

const run = (sql, params = []) => new Promise((resolve, reject) =>
  db.run(sql, params, function(err) { return err ? reject(err) : resolve(this); }));

const os = require('os');

// Nome usado na auditoria, sem duplicar termos como (Admin) e (Administrador)
const formatUsuario = (user) => {
  if (!user) return 'Sistema';
  let nome = (user.nome || '').replace(/\s*\((?:Admin|Administrador)\)\s*/gi, '').trim();
  const cargo = (user.cargo || '').trim();
  if (!cargo || nome.toLowerCase() === cargo.toLowerCase()) {
    return nome || cargo || 'Sistema';
  }
  return `${nome} (${cargo})`;
};

const quem = req => req.sessao ? formatUsuario(req.sessao.user) : 'Sistema';

// Gerenciamento de IP padrão fixo/atribuído por usuário/estação iniciando em 192.168.1.1
const getWorkstationUser = (req) => {
  const customUser = req?.headers?.['x-client-user'];
  if (customUser && customUser.trim()) return customUser.trim();
  const customDev = req?.headers?.['x-client-device'];
  if (customDev && customDev.trim()) {
    return customDev.trim().replace(/^Pc[-_]/i, '');
  }
  return process.env.USERNAME || process.env.USER || 'GM';
};

const getComputerName = (req) => {
  const custom = req?.headers?.['x-client-device'] || req?.headers?.['x-client-user'];
  if (custom && custom.trim()) {
    const val = custom.trim();
    return (val.startsWith('Pc-') || val.startsWith('Pc_')) ? val : `Pc-${val}`;
  }
  // Identifica o usuário real do computador local no SO (ex: GM -> Pc-GM)
  const osUser = process.env.USERNAME || process.env.USER;
  if (osUser && osUser.trim()) {
    return `Pc-${osUser.trim()}`;
  }
  return process.env.COMPUTERNAME || os.hostname() || 'Pc-GM';
};

const getUserIp = async (req, usuarioNome) => {
  const comp = getComputerName(req);
  const osUser = getWorkstationUser(req);
  const nome = (usuarioNome || 'Sistema').trim();

  try {
    const compNorm = comp.toLowerCase();
    const osUserNorm = osUser.toLowerCase();

    // 1. GM / Pc-GM é sempre o IP padrão inicial 192.168.1.1
    if (compNorm === 'pc-gm' || osUserNorm === 'gm') {
      const row = await get('SELECT ip FROM usuario_ips WHERE LOWER(usuario) IN ("pc-gm", "gm")');
      if (row?.ip) return row.ip;
      await run('INSERT OR IGNORE INTO usuario_ips (usuario, ip, criadoEm) VALUES (?, ?, ?)', ['Pc-GM', '192.168.1.1', new Date().toISOString()]);
      return '192.168.1.1';
    }

    // 2. Pc_Lucas / Pc-Lucas / Lucas é sempre 192.168.1.2
    if (compNorm === 'pc_lucas' || compNorm === 'pc-lucas' || osUserNorm === 'lucas') {
      const row = await get('SELECT ip FROM usuario_ips WHERE LOWER(usuario) IN ("pc_lucas", "pc-lucas", "lucas")');
      if (row?.ip) return row.ip;
      await run('INSERT OR IGNORE INTO usuario_ips (usuario, ip, criadoEm) VALUES (?, ?, ?)', ['Pc_Lucas', '192.168.1.2', new Date().toISOString()]);
      return '192.168.1.2';
    }

    // 3. Busca existente por computador exato
    let row = await get('SELECT ip FROM usuario_ips WHERE LOWER(usuario) = LOWER(?)', [comp]);
    if (row?.ip) return row.ip;

    // 4. Busca existente por usuário do SO
    row = await get('SELECT ip FROM usuario_ips WHERE LOWER(usuario) = LOWER(?)', [osUser]);
    if (row?.ip) return row.ip;

    // 5. Busca existente por usuário do sistema (caso não seja acesso compartilhado de diretoria/admin)
    if (!nome.toLowerCase().includes('diretoria') && !nome.toLowerCase().includes('admin')) {
      row = await get('SELECT ip FROM usuario_ips WHERE LOWER(usuario) = LOWER(?)', [nome]);
      if (row?.ip) return row.ip;
    }

    // 6. Novo usuário/computador detectado: aloca o próximo IP sequencial (192.168.1.X)
    const allRows = await new Promise((res, rej) =>
      db.all('SELECT ip FROM usuario_ips', [], (err, rows) => err ? rej(err) : res(rows || []))
    );
    let maxNum = 0;
    allRows.forEach(r => {
      const match = String(r.ip || '').match(/^192\.168\.1\.(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const proximoNumero = Math.max(maxNum + 1, 1);
    const novoIp = `192.168.1.${proximoNumero}`;

    await run('INSERT OR IGNORE INTO usuario_ips (usuario, ip, criadoEm) VALUES (?, ?, ?)', [
      comp,
      novoIp,
      new Date().toISOString(),
    ]);

    return novoIp;
  } catch (err) {
    return '192.168.1.1';
  }
};

const logAudit = async (usuario, acao, entidade, entidadeId, detalhes, req) => {
  if (entidade === 'auditoria') return;
  // Logs gerados apenas em edição, inclusão e exclusão
  const acoesPermitidas = ['Criação', 'Alteração', 'Exclusão', 'Inclusão', 'Edição'];
  if (!acoesPermitidas.includes(acao)) return;

  const now = new Date();
  const data = now.toISOString().slice(0, 10);
  const hora = now.toLocaleTimeString('pt-BR', { hour12: false });
  const comp = getComputerName(req);
  const userIp = await getUserIp(req, usuario);

  db.run(
    `INSERT INTO auditoria (usuario, computador, acao, entidade, entidadeId, detalhes, data, hora, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [usuario || 'Sistema', comp, acao, entidade, entidadeId || null, detalhes || '', data, hora, userIp]
  );
};

// Rota pública para o frontend descobrir o nome da máquina/usuário do SO
app.get('/api/device-info', (req, res) => {
  const osUser = process.env.USERNAME || process.env.USER || 'GM';
  res.json({
    osUser,
    computerName: `Pc-${osUser}`,
  });
});

// Impede relacionar funcionário/corretor inativo a qualquer entidade (imóvel, visita, proposta, contrato, reparo)
const validarFuncionarioAtivo = async (table, data) => {
  const field = (table === 'imoveis' || table === 'reparos')
    ? 'responsavelId'
    : (table === 'visitas' || table === 'negociacoes' || table === 'contratos' ? 'corretorId' : null);

  if (field && data[field] !== undefined && data[field] !== null && data[field] !== '') {
    const funcId = Number(data[field]);
    if (!isNaN(funcId) && funcId > 0) {
      const func = await get('SELECT id, nome, status, cargo FROM funcionarios WHERE id = ?', [funcId]);
      if (!func) {
        return 'O funcionário/corretor selecionado não foi encontrado no sistema.';
      }
      if (func.status && String(func.status).toLowerCase() === 'inativo') {
        const papel = table === 'reparos' ? 'funcionário responsável' : 'corretor';
        return `Não é possível relacionar o ${papel} "${func.nome}" pois seu cadastro está inativo no sistema.`;
      }
    }
  }
  return null;
};

tables.forEach(table => {
  // Cada método exige a ação correspondente no perfil (GET=Visualizar, POST=Criar, PUT=Editar, DELETE=Excluir)
  app.use(`/api/${table}`, autorizar(table));

  // Funcionários nunca expõem a senha; dados pessoais só para quem administra a equipe
  const saida = (req, row) => (table === 'funcionarios' ? filtrarFuncionario(row, req.sessao.permissoes) : row);

  // GET ALL (aceita filtros simples: /api/visitas?clienteId=3)
  app.get(`/api/${table}`, (req, res) => {
    const filters = pickColumns(table, req.query);
    const keys = Object.keys(filters);
    const whereParts = keys.map(k => {
      if (k === 'status') return 'LOWER(status) = LOWER(?)';
      return `${k} = ?`;
    });
    if (table === 'funcionarios' && (req.query.apenasAtivos === 'true' || req.query.ativo === 'true')) {
      whereParts.push("(status IS NULL OR LOWER(status) != 'inativo')");
    }
    const where = whereParts.length ? ' WHERE ' + whereParts.join(' AND ') : '';
    db.all(`SELECT * FROM ${table}${where} ORDER BY id DESC`, Object.values(filters), (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(row => saida(req, row)));
    });
  });

  // GET ONE
  app.get(`/api/${table}/:id`, (req, res) => {
    db.get(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Registro não encontrado.' });
      res.json(saida(req, row));
    });
  });

  // CREATE (o id nunca vem do usuário: é gerado pelo banco)
  app.post(`/api/${table}`, async (req, res) => {
    const data = pickColumns(table, req.body);
    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ error: 'Nenhum dado enviado.' });

    try {
      const erroFuncionario = await validarFuncionarioAtivo(table, data);
      if (erroFuncionario) return res.status(400).json({ error: erroFuncionario });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

    if (table === 'funcionarios' && !data.status) data.status = 'Ativo';

    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;

    db.run(sql, Object.values(data), function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const newId = this.lastID;
      logAudit(quem(req), 'Criação', table, newId, `Registro cadastrado no módulo ${table}`, req);
      res.json(saida(req, { id: newId, ...data }));
    });
  });

  // UPDATE (o id não pode ser alterado)
  app.put(`/api/${table}/:id`, async (req, res) => {
    const data = pickColumns(table, req.body);
    // A senha não volta para a tela: campo vazio na edição mantém a senha atual
    if (table === 'funcionarios' && !data.senha) delete data.senha;
    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ error: 'Nenhum dado enviado.' });

    try {
      const erroFuncionario = await validarFuncionarioAtivo(table, data);
      if (erroFuncionario) return res.status(400).json({ error: erroFuncionario });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

    const sql = `UPDATE ${table} SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`;

    db.run(sql, [...Object.values(data), req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(quem(req), 'Alteração', table, Number(req.params.id), `Registro atualizado no módulo ${table}`, req);
      res.json(saida(req, { id: Number(req.params.id), ...data }));
    });
  });

  // DELETE
  app.delete(`/api/${table}/:id`, async (req, res) => {
    try {
      const blocked = [];
      for (const [child, column, label, where] of deleteGuards[table] || []) {
        const row = await get(`SELECT COUNT(*) as total FROM ${child} WHERE ${where || `${column} = ?`}`, [req.params.id]);
        if (row && row.total > 0) blocked.push(`${row.total} ${label}`);
      }
      if (blocked.length) {
        return res.status(409).json({ error: `Não é possível excluir este registro, pois ele possui restrições ou vínculos: ${blocked.join(', ')}.` });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run(`DELETE FROM ${table} WHERE id=?`, [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(quem(req), 'Exclusão', table, Number(req.params.id), `Registro excluído do módulo ${table}`, req);
      res.json({ deleted: this.changes });
    });
  });
});

// Login do protótipo: a senha não é conferida.
// E-mail de um funcionário cadastrado -> entra com o perfil dele; qualquer outro (ou vazio) -> Visitante.
app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  try {
    const encontrado = email ? await get('SELECT id, status, nome FROM funcionarios WHERE LOWER(email) = LOWER(?)', [email]) : null;
    if (encontrado && String(encontrado.status).toLowerCase() === 'inativo') {
      return res.status(403).json({ error: `O funcionário "${encontrado.nome}" está inativo e não pode acessar o sistema.` });
    }
    const userId = encontrado?.id || await idVisitante();
    if (!userId) return res.status(500).json({ error: 'Usuário Visitante não encontrado. Rode o seed do banco (node seed.js).' });

    const sessao = await carregarSessao(userId);
    return res.json({ success: true, token: gerarToken(userId), ...sessao });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Dados do usuário logado e permissões atualizadas (o frontend consulta ao abrir o sistema)
app.get('/api/auth/me', (req, res) => res.json(req.sessao));

// Dashboard Analytics Route
app.get('/api/dashboard', async (req, res) => {
  const queries = {
    totalClientes: 'SELECT COUNT(*) as v FROM clientes',
    totalProprietarios: 'SELECT COUNT(*) as v FROM proprietarios',
    totalImoveis: 'SELECT COUNT(*) as v FROM imoveis',
    valorPortfolio: 'SELECT COALESCE(SUM(precoVenda), 0) as v FROM imoveis',
    receitaMes: "SELECT COALESCE(SUM(valor), 0) as v FROM financeiro WHERE status='Pago' AND tipo='Receita'",
    despesaMes: "SELECT COALESCE(SUM(valor), 0) as v FROM financeiro WHERE status='Pago' AND (tipo='Despesa' OR tipo='Repasse')",
    repassesPendentes: "SELECT COALESCE(SUM(valor), 0) as v FROM financeiro WHERE status='Pendente' AND tipo='Repasse'",
    visitasPendentes: "SELECT COUNT(*) as v FROM visitas WHERE status='Pendente'",
    negociacoesAndamento: "SELECT COUNT(*) as v FROM negociacoes WHERE status='Em Andamento'",
    totalNegociacoes: "SELECT COUNT(*) as v FROM negociacoes",
    contratosAtivos: "SELECT COUNT(*) as v FROM contratos WHERE status='Ativo'",
    totalContratos: "SELECT COUNT(*) as v FROM contratos",
    totalNotificacoes: "SELECT COUNT(*) as v FROM notificacoes",
    notificacoesAtivas: "SELECT COUNT(*) as v FROM notificacoes WHERE status='Ativo'",
  };
  try {
    const stats = {};
    for (const [key, sql] of Object.entries(queries)) stats[key] = (await get(sql)).v;
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
// Banco vazio (primeira execução ou Render após um deploy): preenche com dados de teste de todos os módulos
const prepararBanco = async () => {
  await db.pronto;
  if ((await get('SELECT COUNT(*) as c FROM funcionarios')).c === 0) {
    console.log('Banco vazio: gerando dados de teste...');
    await popularDadosDeTeste(db);
    console.log('Dados de teste gerados.');
  }
  await garantirAcessosPadrao();
};

prepararBanco()
  .catch(err => console.error('Erro ao preparar o banco:', err.message))
  .finally(() => app.listen(PORT, () => console.log('Backend Urbânia rodando na porta ' + PORT)));
