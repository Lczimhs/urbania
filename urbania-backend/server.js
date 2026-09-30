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
  proprietarios: [['imoveis', 'proprietarioId', 'imóvel(is)']],
  imoveis: [['visitas', 'imovelId', 'visita(s)'], ['negociacoes', 'imovelId', 'negociação(ões)'], ['contratos', 'imovelId', 'contrato(s)']],
};

const get = (sql, params = []) => new Promise((resolve, reject) =>
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

tables.forEach(table => {
  // GET ALL (aceita filtros simples: /api/visitas?clienteId=3)
  app.get(`/api/${table}`, (req, res) => {
    const filters = pickColumns(table, req.query);
    const keys = Object.keys(filters);
    const where = keys.length ? ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ') : '';
    db.all(`SELECT * FROM ${table}${where} ORDER BY id`, Object.values(filters), (err, rows) => {
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
      res.json({ id: this.lastID, ...data });
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
      res.json({ id: Number(req.params.id), ...data });
    });
  });

  // DELETE
  app.delete(`/api/${table}/:id`, async (req, res) => {
    try {
      const blocked = [];
      for (const [child, column, label] of deleteGuards[table] || []) {
        const row = await get(`SELECT COUNT(*) as total FROM ${child} WHERE ${column} = ?`, [req.params.id]);
        if (row.total > 0) blocked.push(`${row.total} ${label}`);
      }
      if (blocked.length) {
        return res.status(409).json({ error: `Não é possível excluir este registro, pois ele possui vínculos: ${blocked.join(', ')}.` });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run(`DELETE FROM ${table} WHERE id=?`, [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

// Dashboard Analytics Route
app.get('/api/dashboard', async (req, res) => {
  const queries = {
    totalClientes: 'SELECT COUNT(*) as v FROM clientes',
    totalProprietarios: 'SELECT COUNT(*) as v FROM proprietarios',
    totalImoveis: 'SELECT COUNT(*) as v FROM imoveis',
    valorPortfolio: 'SELECT COALESCE(SUM(precoVenda), 0) as v FROM imoveis',
    receitaMes: "SELECT COALESCE(SUM(valor), 0) as v FROM financeiro WHERE status='Pago' AND tipo='Receita'",
    visitasPendentes: "SELECT COUNT(*) as v FROM visitas WHERE status='Pendente'",
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
