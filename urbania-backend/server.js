
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const tables = [
  'clientes', 'proprietarios', 'imoveis', 'visitas', 'funcionarios', 'perfis',
  'notificacoes', 'prestadores', 'reparos', 'anuncios', 'despesas', 'multas', 'financeiro', 'auditoria'
];

tables.forEach(table => {
  // GET ALL
  app.get(`/api/${table}`, (req, res) => {
    db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // GET ONE
  app.get(`/api/${table}/:id`, (req, res) => {
    db.get(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });

  // CREATE
  app.post(`/api/${table}`, (req, res) => {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
    
    db.run(sql, values, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    });
  });

  // UPDATE
  app.put(`/api/${table}/:id`, (req, res) => {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const setString = keys.map(k => `${k}=?`).join(',');
    const sql = `UPDATE ${table} SET ${setString} WHERE id=?`;
    
    db.run(sql, [...values, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, ...req.body });
    });
  });

  // DELETE
  app.delete(`/api/${table}/:id`, (req, res) => {
    db.run(`DELETE FROM ${table} WHERE id=?`, [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

// Dashboard Analytics Route
app.get('/api/dashboard', (req, res) => {
  const stats = {};
  let queriesCompleted = 0;
  const queries = [
    { key: 'totalClientes', sql: 'SELECT COUNT(*) as count FROM clientes' },
    { key: 'totalImoveis', sql: 'SELECT COUNT(*) as count FROM imoveis' },
    { key: 'receitaMes', sql: 'SELECT SUM(valor) as total FROM financeiro WHERE status="Pago" AND tipo="Receita"' },
    { key: 'visitasPendentes', sql: 'SELECT COUNT(*) as count FROM visitas WHERE status="Pendente"' },
  ];

  queries.forEach(q => {
    db.get(q.sql, [], (err, row) => {
      stats[q.key] = row ? (row.count !== undefined ? row.count : row.total || 0) : 0;
      queriesCompleted++;
      if (queriesCompleted === queries.length) {
        res.json(stats);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Backend Urbânia rodando na porta ' + PORT);
});
