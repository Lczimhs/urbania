
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err.message);
  else console.log('SQLite conectado.');
});

db.serialize(() => {
  // 1. Clientes
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT, telefone TEXT, tipo TEXT, origem TEXT,
    cpfCnpj TEXT, rg TEXT, dataNascimento TEXT, sexo TEXT, profissao TEXT, renda REAL, estadoCivil TEXT,
    cep TEXT, logradouro TEXT, numero TEXT, bairro TEXT, cidade TEXT, uf TEXT, complemento TEXT,
    finalidade TEXT, tipoImovelBusca TEXT, faixaMin REAL, faixaMax REAL, quartosBusca INTEGER, banheirosBusca INTEGER, bairroBusca TEXT, observacoes TEXT
  )`);

  // 2. Proprietarios
  db.run(`CREATE TABLE IF NOT EXISTS proprietarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT, telefone TEXT, tipo TEXT, cpfCnpj TEXT,
    rg TEXT, dataNascimento TEXT, sexo TEXT, estadoCivil TEXT, profissao TEXT, cep TEXT, logradouro TEXT,
    numero TEXT, bairro TEXT, cidade TEXT, uf TEXT, complemento TEXT, banco TEXT, agencia TEXT, conta TEXT, tipoConta TEXT, chavePix TEXT, titularConta TEXT
  )`);

  // 3. Imoveis
  db.run(`CREATE TABLE IF NOT EXISTS imoveis (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT, finalidade TEXT, proprietarioId INTEGER, responsavel TEXT,
    titulo TEXT, descricao TEXT, cep TEXT, logradouro TEXT, numero TEXT, bairro TEXT, cidade TEXT, uf TEXT, complemento TEXT,
    precoVenda REAL, precoAluguel REAL, condominio REAL, iptu REAL, areaTotal REAL, areaTerreno REAL, quartos INTEGER, suites INTEGER, banheiros INTEGER, vagas INTEGER
  )`);

  // 4. Visitas
  db.run(`CREATE TABLE IF NOT EXISTS visitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, clienteId INTEGER, clienteNome TEXT, imovelId INTEGER, imovelTitulo TEXT,
    corretor TEXT, data TEXT, hora TEXT, status TEXT, descricao TEXT
  )`);

  // 5. Funcionarios
  db.run(`CREATE TABLE IF NOT EXISTS funcionarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT, telefone TEXT, cpf TEXT,
    cargo TEXT, creci TEXT, dataAdmissao TEXT, salario REAL, status TEXT, perfilId INTEGER
  )`);

  // 6. Perfis (Permissões)
  db.run(`CREATE TABLE IF NOT EXISTS perfis (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, descricao TEXT, permissoes TEXT
  )`);

  // 7. Notificacoes
  db.run(`CREATE TABLE IF NOT EXISTS notificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, mensagem TEXT, destinatario TEXT, canal TEXT, dataEnvio TEXT, status TEXT
  )`);

  // 8. Prestadores
  db.run(`CREATE TABLE IF NOT EXISTS prestadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, especialidade TEXT, telefone TEXT, cpfCnpj TEXT, avaliacao REAL
  )`);

  // 9. Reparos
  db.run(`CREATE TABLE IF NOT EXISTS reparos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, imovelId INTEGER, prestadorId INTEGER, descricao TEXT, dataSolicitacao TEXT, status TEXT, valor REAL
  )`);

  // 10. Canais / Anuncios
  db.run(`CREATE TABLE IF NOT EXISTS anuncios (
    id INTEGER PRIMARY KEY AUTOINCREMENT, imovelId INTEGER, canal TEXT, dataPublicacao TEXT, status TEXT, cliques INTEGER, contatos INTEGER
  )`);

  // 11. Despesas
  db.run(`CREATE TABLE IF NOT EXISTS despesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT, valor REAL, dataVencimento TEXT, status TEXT, categoria TEXT
  )`);

  // 12. Multas
  db.run(`CREATE TABLE IF NOT EXISTS multas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, contratoId INTEGER, motivo TEXT, valor REAL, dataAplicacao TEXT, status TEXT
  )`);

  // 13. Financeiro
  db.run(`CREATE TABLE IF NOT EXISTS financeiro (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT, valor REAL, data TEXT, descricao TEXT, status TEXT
  )`);

  // 14. Auditoria
  db.run(`CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT, acao TEXT, entidade TEXT, entidadeId INTEGER, data TEXT, ip TEXT
  )`);
});

module.exports = db;
