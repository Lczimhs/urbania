const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
// Limite maior porque fotos são enviadas junto com o cadastro
app.use(express.json({ limit: '25mb' }));

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

const logAudit = (usuario, acao, entidade, entidadeId, detalhes, ip) => {
  if (entidade === 'auditoria') return;
  const now = new Date();
  const data = now.toISOString().slice(0, 10);
  const hora = now.toLocaleTimeString('pt-BR', { hour12: false });
  db.run(
    `INSERT INTO auditoria (usuario, acao, entidade, entidadeId, detalhes, data, hora, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [usuario || 'Carlos Mendes (Corretor)', acao, entidade, entidadeId || null, detalhes || '', data, hora, ip || '127.0.0.1']
  );
};

tables.forEach(table => {
  // GET ALL (aceita filtros simples: /api/visitas?clienteId=3)
  app.get(`/api/${table}`, (req, res) => {
    const filters = pickColumns(table, req.query);
    const keys = Object.keys(filters);
    const where = keys.length ? ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ') : '';
    db.all(`SELECT * FROM ${table}${where} ORDER BY id DESC`, Object.values(filters), (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // GET ONE
  app.get(`/api/${table}/:id`, (req, res) => {
    db.get(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Registro não encontrado.' });
      res.json(row);
    });
  });

  // CREATE (o id nunca vem do usuário: é gerado pelo banco)
  app.post(`/api/${table}`, (req, res) => {
    const data = pickColumns(table, req.body);
    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ error: 'Nenhum dado enviado.' });
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;

    db.run(sql, Object.values(data), function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const newId = this.lastID;
      logAudit(req.headers['x-user'], 'Criação', table, newId, `Registro cadastrado no módulo ${table}`, req.ip);
      res.json({ id: newId, ...data });
    });
  });

  // UPDATE (o id não pode ser alterado)
  app.put(`/api/${table}/:id`, (req, res) => {
    const data = pickColumns(table, req.body);
    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ error: 'Nenhum dado enviado.' });
    const sql = `UPDATE ${table} SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`;

    db.run(sql, [...Object.values(data), req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(req.headers['x-user'], 'Alteração', table, Number(req.params.id), `Registro atualizado no módulo ${table}`, req.ip);
      res.json({ id: Number(req.params.id), ...data });
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
      logAudit(req.headers['x-user'], 'Exclusão', table, Number(req.params.id), `Registro excluído do módulo ${table}`, req.ip);
      res.json({ deleted: this.changes });
    });
  });
});

// Auth Route: Login exclusivo da Imobiliária (Corretores não têm acesso ao sistema)
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) {
    return res.status(400).json({ error: 'Informe e-mail e senha para acessar o sistema.' });
  }

  try {
    const user = await get('SELECT * FROM funcionarios WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas: e-mail não cadastrado.' });
    }

    // Regra de Negócio: Corretores NÃO têm acesso ao sistema interno da imobiliária
    if (user.cargo === 'Corretor') {
      logAudit(user.nome + ' (Corretor)', 'Acesso Bloqueado', 'auth', user.id, 'Tentativa de login de corretor bloqueada pelas regras de acesso', req.ip);
      return res.status(403).json({
        error: 'Acesso Negado: Corretores não possuem acesso ao sistema interno. O painel é de uso exclusivo da administração da imobiliária.',
        bloqueado: true,
        cargo: user.cargo,
        nome: user.nome,
      });
    }

    if (user.status === 'Inativo') {
      return res.status(403).json({ error: 'Este usuário encontra-se inativo no sistema. Procure a administração.' });
    }

    // Validação da senha
    const senhaCorreta = user.senha ? user.senha === senha : (senha === 'admin123' || senha === 'sec123' || senha === '123456');
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta. Verifique suas credenciais.' });
    }

    logAudit(user.nome + ` (${user.cargo})`, 'Login', 'auth', user.id, 'Acesso realizado com sucesso no sistema interno', req.ip);

    const { senha: _, ...safeUser } = user;
    return res.json({
      success: true,
      token: 'urb_auth_' + Buffer.from(`${user.id}:${Date.now()}`).toString('base64'),
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

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
app.listen(PORT, () => {
  console.log('Backend Urbânia rodando na porta ' + PORT);
});
