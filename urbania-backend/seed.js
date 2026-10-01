const db = require('./database');

async function seed() {
  const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

  console.log('Verificando dados iniciais...');

  // 1. Funcionários / Corretores
  const fCount = (await get('SELECT COUNT(*) as c FROM funcionarios')).c;
  if (fCount === 0) {
    console.log('Criando corretores e funcionários padrão...');
    await run(`
      INSERT INTO funcionarios (nome, cpf, dataNascimento, telefone, email, cargo, creci, status, dataAdmissao)
      VALUES 
        ('Carlos Mendes', '123.456.789-01', '1988-04-12', '(69) 99312-4455', 'carlos.mendes@urbania.com.br', 'Corretor', 'CRECI-RO 4521-F', 'Ativo', '2023-01-15'),
        ('Mariana Silva', '987.654.321-09', '1992-09-24', '(69) 99234-8899', 'mariana.silva@urbania.com.br', 'Corretor', 'CRECI-RO 6102-F', 'Ativo', '2023-05-10'),
        ('Fernanda Oliveira', '555.444.333-22', '1995-11-03', '(69) 99876-1122', 'fernanda@urbania.com.br', 'Secretária', null, 'Ativo', '2024-02-01')
    `);
  }

  // 2. Proprietários
  const pCount = (await get('SELECT COUNT(*) as c FROM proprietarios')).c;
  if (pCount === 0) {
    console.log('Criando proprietários padrão...');
    await run(`
      INSERT INTO proprietarios (nome, email, telefone, tipo, cpfCnpj, rg, banco, agencia, conta, tipoConta, chavePix, titularConta, logradouro, numero, bairro, cidade, uf, cep)
      VALUES 
        ('Roberto de Souza', 'roberto.souza@gmail.com', '(69) 99988-1234', 'Física', '321.654.987-12', '1234567-SSP/RO', 'Banco do Brasil', '1234', '56789-0', 'Corrente', 'roberto.souza@gmail.com', 'Roberto de Souza', 'Av. Brasil', '1520', 'Nova Brasília', 'Ji-Paraná', 'RO', '76900-000'),
        ('Construtora Alvorada Ltda', 'contato@alvorada.com.br', '(69) 3421-5000', 'Jurídica', '12.345.678/0001-90', null, 'Itaú', '0450', '22334-1', 'Corrente', '12.345.678/0001-90', 'Construtora Alvorada Ltda', 'Rua Marechal Rondon', '350', 'Centro', 'Ji-Paraná', 'RO', '76900-010')
    `);
  }

  // 3. Imóveis
  const iCount = (await get('SELECT COUNT(*) as c FROM imoveis')).c;
  if (iCount === 0) {
    console.log('Criando imóveis padrão...');
    await run(`
      INSERT INTO imoveis (tipo, finalidade, proprietarioId, responsavelId, responsavel, titulo, descricao, cep, logradouro, numero, bairro, cidade, uf, precoVenda, precoAluguel, condominio, iptu, areaTotal, areaTerreno, quartos, suites, banheiros, vagas, fotos)
      VALUES 
        ('Apartamento', 'Venda', 1, 1, 'Carlos Mendes', 'Apartamento 3 Quartos com Vista Panorâmica', 'Excelente apartamento no Centro com sacada gourmet e móveis planejados.', '76900-010', 'Av. Marechal Rondon', '412', 'Centro', 'Ji-Paraná', 'RO', 450000, 0, 420, 950, 115, 0, 3, 1, 2, 2, '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"]'),
        ('Casa', 'Venda e Aluguel', 2, 2, 'Mariana Silva', 'Casa Térrea em Condomínio Fechado', 'Casa moderna com piscina privativa, 4 dormitórios e alto padrão de acabamento.', '76901-100', 'Rua dos Flamboyants', '88', 'Dois de Abril', 'Ji-Paraná', 'RO', 850000, 4200, 350, 1200, 240, 360, 4, 2, 3, 3, '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"]')
    `);
  }

  // 4. Clientes adicionais
  const cCount = (await get('SELECT COUNT(*) as c FROM clientes')).c;
  if (cCount <= 1) {
    console.log('Criando clientes de demonstração...');
    await run(`
      INSERT INTO clientes (nome, email, telefone, tipo, origem, cpfCnpj, dataNascimento, estadoCivil, profissao, renda, cep, logradouro, numero, bairro, cidade, uf, finalidade, tipoImovelBusca, faixaMin, faixaMax, quartosBusca, banheirosBusca)
      VALUES 
        ('Beatriz Helena Lima', 'beatriz.lima@yahoo.com.br', '(69) 99345-6789', 'Comprador', 'Site', '456.789.012-34', '1985-07-19', 'Casado(a)', 'Médica', 18500, '76900-020', 'Rua 22 de Novembro', '501', 'Casa Preta', 'Ji-Paraná', 'RO', 'Compra', 'Apartamento', 350000, 500000, 3, 2),
        ('Lucas Vilas Boas', 'lucas.vboas@gmail.com', '(69) 99222-3344', 'Interessado', 'Indicação', '678.901.234-56', '1994-03-11', 'Solteiro(a)', 'Engenheiro de Software', 12000, '76900-110', 'Av. 6 de Maio', '102', 'Centro', 'Ji-Paraná', 'RO', 'Compra', 'Casa', 400000, 850000, 3, 2)
    `);
  }

  // 5. Negociações
  const nCount = (await get('SELECT COUNT(*) as c FROM negociacoes')).c;
  if (nCount === 0) {
    console.log('Criando negociações de exemplo...');
    await run(`
      INSERT INTO negociacoes (clienteId, clienteNome, imovelId, imovelTitulo, proprietarioId, proprietarioNome, corretorId, corretor, tipo, data, valor, status, formaPagamento, observacoes)
      VALUES 
        (2, 'Beatriz Helena Lima', 1, 'Apartamento 3 Quartos com Vista Panorâmica', 1, 'Roberto de Souza', 1, 'Carlos Mendes', 'Venda', '2026-09-25', 430000, 'Em Andamento', 'Financiamento Bancário', 'Proposta apresentada com entrada de R$ 130.000 e saldo de R$ 300.000 via CEF. Aguardando aceite do proprietário.'),
        (3, 'Lucas Vilas Boas', 2, 'Casa Térrea em Condomínio Fechado', 2, 'Construtora Alvorada Ltda', 2, 'Mariana Silva', 'Venda', '2026-09-28', 820000, 'Em Andamento', 'À Vista (PIX / Transferência)', 'Proposta com desconto para pagamento à vista. Proprietário analisando contraproposta de R$ 835.000.')
    `);
  }

  // 6. Visitas
  const vCount = (await get('SELECT COUNT(*) as c FROM visitas')).c;
  if (vCount === 0) {
    console.log('Criando visitas de exemplo...');
    await run(`
      INSERT INTO visitas (clienteId, clienteNome, imovelId, imovelTitulo, corretorId, corretor, data, hora, status, descricao)
      VALUES 
        (2, 'Beatriz Helena Lima', 1, 'Apartamento 3 Quartos com Vista Panorâmica', 1, 'Carlos Mendes', '2026-10-02', '15:30', 'Confirmada', 'Segunda visita para avaliação da iluminação solar e medição dos quartos.')
    `);
  }

  console.log('Seed finalizado com sucesso!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
