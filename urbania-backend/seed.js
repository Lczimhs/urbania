// Preenche um banco VAZIO com os dados de teste de todos os módulos (ver dados-teste.js).
// O servidor já faz isso sozinho ao subir; este script existe para quem roda "node seed.js"
// (ex.: comando de build/início do Render). Banco que já tem dados não é alterado.
// Para recriar do zero: npm run resetar-banco e depois npm start.
const db = require('./database');
const popularDadosDeTeste = require('./dados-teste');

const get = (sql, params = []) => new Promise((resolve, reject) =>
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

(async () => {
  await db.pronto;
  if ((await get('SELECT COUNT(*) as c FROM funcionarios')).c > 0) {
    console.log('O banco já possui dados: nada foi alterado. (Para recriar: npm run resetar-banco)');
  } else {
    console.log('Banco vazio: gerando dados de teste...');
    await popularDadosDeTeste(db);
    console.log('Dados de teste gerados.');
  }
  process.exit(0);
})().catch(err => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
