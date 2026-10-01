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
    console.log('Criando funcionários e equipe padrão...');
    await run(`
      INSERT INTO funcionarios (nome, cpf, dataNascimento, telefone, email, senha, cargo, creci, status, dataAdmissao, perfilId)
      VALUES 
        ('Diretoria Urbânia (Admin)', '000.111.222-33', '1982-05-15', '(69) 99888-7766', 'admin@urbania.com.br', 'admin123', 'Administrador', null, 'Ativo', '2022-01-01', 1),
        ('Fernanda Oliveira', '555.444.333-22', '1995-11-03', '(69) 99876-1122', 'fernanda@urbania.com.br', 'sec123', 'Secretária', null, 'Ativo', '2024-02-01', 3),
        ('Carlos Mendes', '123.456.789-01', '1988-04-12', '(69) 99312-4455', 'carlos.mendes@urbania.com.br', 'corretor123', 'Corretor', 'CRECI-RO 4521-F', 'Ativo', '2023-01-15', 2),
        ('Mariana Silva', '987.654.321-09', '1992-09-24', '(69) 99234-8899', 'mariana.silva@urbania.com.br', 'corretor123', 'Corretor', 'CRECI-RO 6102-F', 'Ativo', '2023-05-10', 2)
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

  // 7. Serviços
  const sCount = (await get('SELECT COUNT(*) as c FROM servicos')).c;
  if (sCount === 0) {
    console.log('Criando serviços padrão...');
    await run(`
      INSERT INTO servicos (nome, descricao, categoria)
      VALUES
        ('Reparo elétrico', 'Troca de tomadas, disjuntores e revisão da fiação.', 'Elétrica'),
        ('Desentupimento e vazamentos', 'Desentupimento de pias/ralos e conserto de vazamentos.', 'Hidráulica'),
        ('Pintura interna', 'Pintura de paredes e tetos, incluindo massa corrida.', 'Pintura')
    `);
  }

  // 8. Prestadores de serviço
  const prCount = (await get('SELECT COUNT(*) as c FROM prestadores')).c;
  if (prCount === 0) {
    console.log('Criando prestadores de serviço padrão...');
    await run(`
      INSERT INTO prestadores (nome, razaoSocial, cpfCnpj, email, telefone, pais, uf, cidade, bairro, logradouro, numero, servicos, especialidade, banco, agencia, conta, tipoChavePix, chavePix)
      VALUES
        ('João Eletricista', null, '234.567.890-12', 'joao.eletricista@gmail.com', '(69) 99111-2233', 'Brasil', 'RO', 'Ji-Paraná', 'Centro', 'Rua Rio Branco', '210', '[1]', 'Reparo elétrico', 'Caixa', '0123', '45678-9', 'Celular', '(69) 99111-2233'),
        ('Reforma Fácil', 'Reforma Fácil Serviços Ltda', '23.456.789/0001-01', 'contato@reformafacil.com.br', '(69) 3422-7788', 'Brasil', 'RO', 'Ji-Paraná', 'Nova Brasília', 'Av. Brasil', '900', '[2,3]', 'Desentupimento e vazamentos, Pintura interna', 'Sicoob', '3325', '11223-4', 'CNPJ', '23.456.789/0001-01')
    `);
  }

  // 9. Reparos
  const rCount = (await get('SELECT COUNT(*) as c FROM reparos')).c;
  if (rCount === 0) {
    console.log('Criando reparos de exemplo...');
    await run(`
      INSERT INTO reparos (imovelId, servicoId, prestadorId, responsavelId, responsavel, descricao, dataSolicitacao, status, valor)
      VALUES
        (1, 1, 1, 1, 'Carlos Mendes', 'Disjuntor da cozinha desarmando com frequência; tomada da sala sem energia.', '2026-09-29', 'Pendente', 380)
    `);
  }

  // 10. Canais de publicação
  const caCount = (await get('SELECT COUNT(*) as c FROM canais')).c;
  if (caCount === 0) {
    console.log('Criando canais de publicação padrão...');
    await run(`
      INSERT INTO canais (nome, tipoCanal, observacoes)
      VALUES
        ('Site Urbânia', 'Site', 'Vitrine própria da imobiliária.'),
        ('Jornal Diário da Amazônia', 'Impresso', 'Classificados de domingo.'),
        ('Portal ZAP Imóveis', 'Anunciado', 'Plano com 20 anúncios ativos.')
    `);
  }

  // 11. Anúncios
  const aCount = (await get('SELECT COUNT(*) as c FROM anuncios')).c;
  if (aCount === 0) {
    console.log('Criando anúncios de exemplo...');
    await run(`
      INSERT INTO anuncios (imovelId, canalId, canal, descricao, valor, status, dataPublicacao)
      VALUES
        (1, 1, 'Site Urbânia', 'Apartamento com vista panorâmica no Centro, 3 quartos sendo 1 suíte, sacada gourmet e 2 vagas.', 450000, 'Ativo', '2026-09-26'),
        (2, 3, 'Portal ZAP Imóveis', 'Casa térrea em condomínio fechado com piscina privativa e 4 dormitórios.', 850000, 'Ativo', '2026-09-27')
    `);
  }

  // 12. Contratos
  const ctCount = (await get('SELECT COUNT(*) as c FROM contratos')).c;
  if (ctCount === 0) {
    console.log('Criando contratos de exemplo...');
    await run(`
      INSERT INTO contratos (
        clienteId, clienteNome, imovelId, imovelTitulo, proprietarioId, proprietarioNome,
        corretorId, corretor, tipo, status, finalidade, dataInicio, dataFim, dataAssinatura,
        valor, condominio, iptu, diaVencimento, formaPagamento, taxaAdministracao,
        repasseProprietario, garantiaTipo, garantiaValor, garantiaDetalhes,
        indiceReajuste, multaAtraso, multaRescisoria, observacoes
      ) VALUES
        (
          3, 'Lucas Vilas Boas', 2, 'Casa Térrea em Condomínio Fechado', 2, 'Construtora Alvorada Ltda',
          2, 'Mariana Silva', 'Locação', 'Ativo', 'Residencial', '2026-02-01', '2027-01-31', '2026-01-25',
          4200.00, 350.00, 100.00, 10, 'Boleto Bancário', 10.0,
          3780.00, 'Seguro Fiança', 4200.00, 'Apólice Porto Seguro #994821 - Cobertura de 12 meses.',
          'IPCA', 2.0, '3 meses de aluguel proporcional ao prazo restante.',
          'Contrato padrão de locação residencial por 12 meses. Vistoria inicial registrada com sucesso.'
        ),
        (
          2, 'Beatriz Helena Lima', 1, 'Apartamento 3 Quartos com Vista Panorâmica', 1, 'Roberto de Souza',
          1, 'Carlos Mendes', 'Compra e Venda', 'Ativo', 'Residencial', '2026-09-25', null, '2026-09-25',
          430000.00, 420.00, 950.00, null, 'Financiamento Bancário', 6.0,
          404200.00, 'Sem Garantia / Não Aplicável', 0, null,
          'Fixo (Sem Reajuste)', 0, 'Cláusula penal resolutiva de 10% sobre o valor global em caso de desistência imotivada.',
          'Instrumento particular de compromisso de compra e venda com entrada de R$ 130.000,00 e saldo via financiamento habitacional CEF.'
        )
    `);
  }

  // 13. Notificações (Templates e Regras)
  const notifCount = (await get('SELECT COUNT(*) as c FROM notificacoes')).c;
  if (notifCount === 0) {
    console.log('Criando regras de notificações automáticas...');
    await run(`
      INSERT INTO notificacoes (nome, gatilho, canais, canal, titulo, mensagem, destinatario, status, dataCriacao)
      VALUES
        ('Boas-vindas ao Cliente', 'Novo Cliente Cadastrado', '["WhatsApp","E-mail"]', 'WhatsApp', 'Bem-vindo à Urbânia', 'Olá, {NomeCliente}! Seja bem-vindo à Urbânia Imóveis. Estamos prontos para encontrar o imóvel ideal para você!', 'Cliente', 'Ativo', '2026-09-01'),
        ('Confirmação de Visita', 'Visita Agendada', '["WhatsApp","SMS"]', 'WhatsApp', 'Visita Confirmada', 'Olá {NomeCliente}, sua visita ao imóvel {Imovel} está confirmada para {Data} às {Hora} com o corretor {Corretor}.', 'Cliente', 'Ativo', '2026-09-02'),
        ('Aviso de Nova Proposta', 'Proposta/Negociação Recebida', '["E-mail","WhatsApp"]', 'E-mail', 'Nova Proposta Recebida', 'Prezado(a) {NomeProprietario}, recebemos uma nova proposta no valor de {Valor} para seu imóvel {Imovel}. Em breve entraremos em contato.', 'Proprietário', 'Ativo', '2026-09-03'),
        ('Lembrete de Vencimento de Aluguel', 'Vencimento de Aluguel (3 dias antes)', '["WhatsApp","E-mail"]', 'WhatsApp', 'Lembrete de Aluguel', 'Olá {NomeCliente}, lembramos que o aluguel do imóvel {Imovel} vence em {Data}, no valor de {Valor}. Qualquer dúvida, estamos à disposição!', 'Cliente', 'Ativo', '2026-09-04'),
        ('Aviso de Repasse ao Proprietário', 'Repasse Realizado ao Proprietário', '["WhatsApp","E-mail"]', 'WhatsApp', 'Repasse Financeiro Realizado', 'Olá {NomeProprietario}, confirmamos o repasse líquido de {Valor} referente ao aluguel do imóvel {Imovel} via chave PIX {ChavePix}.', 'Proprietário', 'Ativo', '2026-09-05')
    `);
  }

  // 14. Financeiro
  const finCount = (await get('SELECT COUNT(*) as c FROM financeiro')).c;
  if (finCount === 0) {
    console.log('Criando lançamentos e operações financeiras...');
    await run(`
      INSERT INTO financeiro (tipo, categoria, descricao, valor, dataVencimento, dataPagamento, status, formaPagamento, clienteId, clienteNome, imovelId, imovelTitulo, proprietarioId, proprietarioNome, contratoId, reciboNumero, data, operador)
      VALUES
        ('Receita', 'Aluguel de Imóvel', 'Aluguel Mensal - Competência Setembro/2026', 4200.00, '2026-09-10', '2026-09-08', 'Pago', 'Boleto Bancário', 3, 'Lucas Vilas Boas', 2, 'Casa Térrea em Condomínio Fechado', 2, 'Construtora Alvorada Ltda', 1, 'REC-20260908-01', '2026-09-08', 'Mariana Silva'),
        ('Receita', 'Taxa de Administração', 'Honorários de Gestão Locatícia (10%)', 420.00, '2026-09-10', '2026-09-08', 'Pago', 'Retenção Automática', 3, 'Lucas Vilas Boas', 2, 'Casa Térrea em Condomínio Fechado', 2, 'Construtora Alvorada Ltda', 1, 'REC-20260908-02', '2026-09-08', 'Mariana Silva'),
        ('Repasse', 'Repasse ao Proprietário', 'Repasse Líquido de Aluguel - Construtora Alvorada', 3780.00, '2026-09-15', '2026-09-15', 'Pago', 'PIX', null, null, 2, 'Casa Térrea em Condomínio Fechado', 2, 'Construtora Alvorada Ltda', 1, 'REP-20260915-01', '2026-09-15', 'Carlos Mendes'),
        ('Receita', 'Comissão de Venda', 'Comissão de Intermediação - Venda Apartamento Centro', 25800.00, '2026-09-30', '2026-09-28', 'Pago', 'Transferência Bancária', 2, 'Beatriz Helena Lima', 1, 'Apartamento 3 Quartos com Vista Panorâmica', 1, 'Roberto de Souza', 2, 'REC-20260928-04', '2026-09-28', 'Carlos Mendes'),
        ('Despesa', 'Marketing e Divulgação', 'Divulgação em Portais Imobiliários e Mídias Sociais', 1450.00, '2026-10-05', null, 'Pendente', 'Boleto Bancário', null, null, null, null, null, null, null, null, '2026-09-25', 'Carlos Mendes'),
        ('Despesa', 'Administrativa', 'Telefonia, Internet Fibra e Softwares de Gestão', 890.00, '2026-10-10', null, 'Pendente', 'Débito em Conta', null, null, null, null, null, null, null, null, '2026-09-26', 'Carlos Mendes'),
        ('Repasse', 'Repasse ao Proprietário', 'Repasse Líquido de Aluguel - Competência Outubro', 3780.00, '2026-10-15', null, 'Pendente', 'PIX', null, null, 2, 'Casa Térrea em Condomínio Fechado', 2, 'Construtora Alvorada Ltda', 1, null, '2026-09-30', 'Carlos Mendes')
    `);
  }

  // 15. Auditoria de Log (RNF 4.1)
  const auditCount = (await get('SELECT COUNT(*) as c FROM auditoria')).c;
  if (auditCount === 0) {
    console.log('Criando logs de auditoria iniciais...');
    await run(`
      INSERT INTO auditoria (usuario, acao, entidade, entidadeId, detalhes, data, hora, ip)
      VALUES
        ('Carlos Mendes (Corretor)', 'Criação', 'clientes', 2, 'Cadastro inicial da cliente Beatriz Helena Lima', '2026-09-25', '09:14:02', '192.168.1.45'),
        ('Carlos Mendes (Corretor)', 'Criação', 'imoveis', 1, 'Cadastro do imóvel Apartamento 3 Quartos no Centro', '2026-09-25', '10:30:15', '192.168.1.45'),
        ('Mariana Silva (Corretor)', 'Criação', 'contratos', 1, 'Assinatura e ativação do Contrato de Locação #1', '2026-09-26', '14:20:10', '192.168.1.52'),
        ('Carlos Mendes (Corretor)', 'Baixa de Pagamento', 'financeiro', 1, 'Confirmação e baixa do pagamento de aluguel (Recibo REC-20260908-01)', '2026-09-28', '11:42:00', '192.168.1.45'),
        ('Carlos Mendes (Corretor)', 'Criação', 'contratos', 2, 'Cadastro do Contrato de Compra e Venda #2', '2026-09-28', '16:10:05', '192.168.1.45')
    `);
  }

  // 16. Perfis de Acesso (RF F9-F12)
  const perfCount = (await get('SELECT COUNT(*) as c FROM perfis')).c;
  if (perfCount === 0) {
    console.log('Criando perfis de acesso padrão...');
    const allActions = ['Visualizar', 'Criar', 'Editar', 'Excluir'];
    const allModulesList = ['clientes', 'proprietarios', 'imoveis', 'visitas', 'negociacoes', 'contratos', 'financeiro', 'despesas', 'multas', 'relatorios', 'notificacoes', 'funcionarios', 'perfis', 'servicos', 'prestadores', 'reparos', 'canais', 'anuncios'];
    const adminPerms = {};
    allModulesList.forEach(m => { adminPerms[m] = [...allActions]; });

    const corretorPerms = {
      clientes: ['Visualizar', 'Criar', 'Editar'],
      proprietarios: ['Visualizar', 'Criar', 'Editar'],
      imoveis: ['Visualizar', 'Criar', 'Editar'],
      visitas: ['Visualizar', 'Criar', 'Editar', 'Excluir'],
      negociacoes: ['Visualizar', 'Criar', 'Editar'],
      contratos: ['Visualizar'],
      financeiro: ['Visualizar'],
      relatorios: ['Visualizar'],
      notificacoes: ['Visualizar'],
      anuncios: ['Visualizar', 'Criar', 'Editar'],
    };

    const secretariaPerms = {
      clientes: ['Visualizar', 'Criar', 'Editar'],
      proprietarios: ['Visualizar'],
      imoveis: ['Visualizar'],
      visitas: ['Visualizar', 'Criar', 'Editar', 'Excluir'],
      notificacoes: ['Visualizar', 'Criar'],
      servicos: ['Visualizar'],
      prestadores: ['Visualizar'],
      reparos: ['Visualizar', 'Criar'],
    };

    await run(`
      INSERT INTO perfis (nome, descricao, permissoes, status, nativo)
      VALUES 
        ('Administrador', 'Acesso total e irrestrito a todos os módulos, relatórios gerenciais e configurações do sistema.', ?, 'Ativo', 1),
        ('Corretor', 'Acesso às operações imobiliárias, gestão de clientes, imóveis, agendamento de visitas e negociações.', ?, 'Ativo', 1),
        ('Secretária', 'Atendimento ao público, recepção de clientes, agendamento de visitas e rotinas operacionais.', ?, 'Ativo', 0)
    `, [JSON.stringify(adminPerms), JSON.stringify(corretorPerms), JSON.stringify(secretariaPerms)]);

    // Vincula funcionários existentes aos perfis
    await run('UPDATE funcionarios SET perfilId = 2 WHERE cargo = "Corretor"');
    await run('UPDATE funcionarios SET perfilId = 3 WHERE cargo = "Secretária"');
  }

  // 17. Gestão de Multas (RF F1-F4)
  const multasCount = (await get('SELECT COUNT(*) as c FROM multas')).c;
  if (multasCount === 0) {
    console.log('Criando multas de exemplo...');
    const hist1 = JSON.stringify([
      { de: null, para: 'Pendente', data: '2026-09-12 10:30', usuario: 'Sistema Automático' }
    ]);
    const hist2 = JSON.stringify([
      { de: null, para: 'Pendente', data: '2026-09-15 08:45', usuario: 'Mariana Silva' },
      { de: 'Pendente', para: 'Pago', data: '2026-09-25 14:10', usuario: 'Carlos Mendes' }
    ]);

    await run(`
      INSERT INTO multas (contratoId, clienteId, clienteNome, motivo, tipo, modoValor, valor, percentual, valorCalculado, dataAplicacao, dataVencimento, status, historicoStatus)
      VALUES
        (1, 3, 'Lucas Vilas Boas', 'Atraso no pagamento do aluguel referente à competência 08/2026.', 'Atraso no pagamento', 'Percentual (%)', 84.00, 2.0, 84.00, '2026-09-12', '2026-10-10', 'Pendente', ?),
        (1, 3, 'Lucas Vilas Boas', 'Dano acidental ao portão basculante durante descarga de mudança.', 'Dano ao imóvel', 'Fixo (R$)', 350.00, 0, 350.00, '2026-09-15', '2026-09-25', 'Pago', ?)
    `, [hist1, hist2]);
  }

  // 18. Controle de Despesas (RF F1-F4)
  const despCount = (await get('SELECT COUNT(*) as c FROM despesas')).c;
  if (despCount === 0) {
    console.log('Criando despesas de exemplo...');
    const histD1 = JSON.stringify([
      { de: null, para: 'Pendente', data: '2026-09-26 09:00', usuario: 'Carlos Mendes' }
    ]);
    const histD2 = JSON.stringify([
      { de: null, para: 'Pendente', data: '2026-09-20 11:15', usuario: 'Carlos Mendes' },
      { de: 'Pendente', para: 'Pago', data: '2026-09-28 16:30', usuario: 'Carlos Mendes' }
    ]);
    const histD3 = JSON.stringify([
      { de: null, para: 'Pendente', data: '2026-09-10 14:00', usuario: 'Carlos Mendes' },
      { de: 'Pendente', para: 'Atrasado', data: '2026-09-21 00:01', usuario: 'Sistema Automático' }
    ]);

    await run(`
      INSERT INTO despesas (descricao, valor, dataVencimento, dataPagamento, status, categoria, imovelId, imovelTitulo, formaPagamento, observacoes, comprovante, historicoStatus)
      VALUES
        ('Conta de Energia Elétrica e Internet Fibra da Sede', 650.00, '2026-10-10', null, 'Pendente', 'Administrativa', null, null, 'Boleto Bancário', 'Consumo referente ao mês anterior.', null, ?),
        ('Manutenção e Substituição de Disjuntores e Tomadas', 380.00, '2026-09-28', '2026-09-28', 'Pago', 'Manutenção de imóveis sob gestão', 1, 'Apartamento 3 Quartos com Vista Panorâmica', 'PIX', 'Serviço executado pelo prestador João Eletricista.', null, ?),
        ('Campanha de Mídia Paga no Google Ads e Instagram', 1200.00, '2026-09-20', null, 'Atrasado', 'Marketing', null, null, 'Cartão de Crédito', 'Aguardando validação da fatura pelo gerente.', null, ?)
    `, [histD1, histD2, histD3]);
  }

  console.log('Seed finalizado com sucesso!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
