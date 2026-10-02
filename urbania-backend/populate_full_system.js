const db = require('./database');

async function run() {
  const execute = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  const queryAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

  const queryOne = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

  console.log('Iniciando sincronização e inserção em massa de dados de teste...');

  // 1. Corrigir inconsistências prévias de IDs nos dados existentes
  await execute(`UPDATE negociacoes SET clienteId = 1, corretorId = 3 WHERE clienteNome = 'Beatriz Helena Lima'`);
  await execute(`UPDATE negociacoes SET clienteId = 2, corretorId = 4 WHERE clienteNome = 'Lucas Vilas Boas'`);
  await execute(`UPDATE contratos SET clienteId = 1, corretorId = 3 WHERE clienteNome = 'Beatriz Helena Lima'`);
  await execute(`UPDATE contratos SET clienteId = 2, corretorId = 4 WHERE clienteNome = 'Lucas Vilas Boas'`);
  await execute(`UPDATE visitas SET clienteId = 1, corretorId = 3 WHERE clienteNome = 'Beatriz Helena Lima'`);
  await execute(`UPDATE multas SET clienteId = 2 WHERE clienteNome = 'Lucas Vilas Boas'`);
  await execute(`UPDATE financeiro SET clienteId = 1 WHERE clienteNome = 'Beatriz Helena Lima'`);
  await execute(`UPDATE financeiro SET clienteId = 2 WHERE clienteNome = 'Lucas Vilas Boas'`);

  // 2. Novos Funcionários / Corretores
  const existingCorretores = await queryAll(`SELECT nome FROM funcionarios`);
  const existingCorrNomes = new Set(existingCorretores.map(f => f.nome));

  const novosFuncionarios = [
    {
      nome: 'Rafael Fontes de Alencar',
      cpf: '321.987.654-10',
      dataNascimento: '1985-03-14',
      telefone: '(69) 99311-2244',
      telefoneFixo: '(69) 3421-1190',
      email: 'rafael.fontes@urbania.com.br',
      senha: 'corretor123',
      cargo: 'Corretor',
      creci: 'CRECI-RO 5412-F',
      status: 'Ativo',
      dataAdmissao: '2023-08-01',
      perfilId: 2,
      salario: 4500,
      cep: '76900-112',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      bairro: 'Centro',
      logradouro: 'Av. Marechal Rondon',
      numero: '780',
    },
    {
      nome: 'Juliana Camargo Peixoto',
      cpf: '456.123.789-22',
      dataNascimento: '1991-07-28',
      telefone: '(69) 99245-8811',
      telefoneFixo: '(69) 3422-9011',
      email: 'juliana.peixoto@urbania.com.br',
      senha: 'corretor123',
      cargo: 'Corretor',
      creci: 'CRECI-RO 7219-F',
      status: 'Ativo',
      dataAdmissao: '2023-11-15',
      perfilId: 2,
      salario: 4200,
      cep: '76900-340',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      bairro: 'Dois de Abril',
      logradouro: 'Rua São Paulo',
      numero: '1340',
    },
    {
      nome: 'Marcelo Queiroz Guimarães',
      cpf: '654.789.123-33',
      dataNascimento: '1983-12-05',
      telefone: '(69) 99388-7711',
      telefoneFixo: '(69) 3421-5544',
      email: 'marcelo.queiroz@urbania.com.br',
      senha: 'corretor123',
      cargo: 'Corretor',
      creci: 'CRECI-RO 3890-F',
      status: 'Ativo',
      dataAdmissao: '2022-04-10',
      perfilId: 2,
      salario: 5200,
      cep: '76900-050',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      bairro: 'Urupá',
      logradouro: 'Av. Transcontinental',
      numero: '2105',
    },
    {
      nome: 'Camila Vasconcelos Ribeiro',
      cpf: '789.321.456-44',
      dataNascimento: '1993-02-18',
      telefone: '(69) 99201-9933',
      telefoneFixo: null,
      email: 'camila.ribeiro@urbania.com.br',
      senha: 'corretor123',
      cargo: 'Corretor',
      creci: 'CRECI-RO 6844-F',
      status: 'Ativo',
      dataAdmissao: '2024-01-08',
      perfilId: 2,
      salario: 4000,
      cep: '76900-025',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      bairro: 'Casa Preta',
      logradouro: 'Rua 22 de Novembro',
      numero: '920',
    },
    {
      nome: 'Eduardo Brandão Coutinho',
      cpf: '234.890.123-55',
      dataNascimento: '1980-09-30',
      telefone: '(69) 99355-6677',
      telefoneFixo: '(69) 3422-4411',
      email: 'eduardo.brandao@urbania.com.br',
      senha: 'corretor123',
      cargo: 'Corretor',
      creci: 'CRECI-RO 2911-F',
      status: 'Ativo',
      dataAdmissao: '2021-09-01',
      perfilId: 2,
      salario: 6000,
      cep: '76900-110',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      bairro: 'Centro',
      logradouro: 'Av. 6 de Maio',
      numero: '450',
    },
    {
      nome: 'Patrícia Nogueira Sampaio',
      cpf: '890.123.456-66',
      dataNascimento: '1989-06-11',
      telefone: '(69) 99233-4455',
      telefoneFixo: null,
      email: 'patricia.sampaio@urbania.com.br',
      senha: 'corretor123',
      cargo: 'Corretor',
      creci: 'CRECI-RO 8104-F',
      status: 'Ativo',
      dataAdmissao: '2024-03-01',
      perfilId: 2,
      salario: 4100,
      cep: '76900-210',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      bairro: 'Jardim dos Migrantes',
      logradouro: 'Rua T-15',
      numero: '312',
    },
  ];

  for (const f of novosFuncionarios) {
    if (!existingCorrNomes.has(f.nome)) {
      await execute(`
        INSERT INTO funcionarios (nome, cpf, dataNascimento, telefone, telefoneFixo, email, senha, cargo, creci, status, dataAdmissao, perfilId, salario, cep, cidade, uf, bairro, logradouro, numero)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [f.nome, f.cpf, f.dataNascimento, f.telefone, f.telefoneFixo, f.email, f.senha, f.cargo, f.creci, f.status, f.dataAdmissao, f.perfilId, f.salario, f.cep, f.cidade, f.uf, f.bairro, f.logradouro, f.numero]);
    }
  }

  // 3. Novos Proprietários
  const existingProprietarios = await queryAll(`SELECT nome FROM proprietarios`);
  const existingPropNomes = new Set(existingProprietarios.map(p => p.nome));

  const novosProprietarios = [
    {
      nome: 'Dr. Valdir Antunes Meireles',
      email: 'valdir.meireles@clinicamedica.com.br',
      telefone: '(69) 99981-4411',
      tipo: 'Física',
      cpfCnpj: '234.567.890-01',
      rg: '145289-SSP/RO',
      profissao: 'Médico Cardiologista',
      estadoCivil: 'Casado(a)',
      banco: 'Banco do Brasil',
      agencia: '0840',
      conta: '34102-9',
      tipoConta: 'Corrente',
      chavePix: 'valdir.meireles@clinicamedica.com.br',
      titularConta: 'Valdir Antunes Meireles',
      logradouro: 'Av. Brasil',
      numero: '2210',
      bairro: 'Nova Brasília',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      cep: '76900-000',
    },
    {
      nome: 'Helena Montenegro Castro',
      email: 'helena.montenegro@adv.com.br',
      telefone: '(69) 99234-9988',
      tipo: 'Física',
      cpfCnpj: '345.678.901-12',
      rg: '256190-SSP/RO',
      profissao: 'Advogada',
      estadoCivil: 'Divorciado(a)',
      banco: 'Caixa Econômica',
      agencia: '1290',
      conta: '10982-1',
      tipoConta: 'Corrente',
      chavePix: '345.678.901-12',
      titularConta: 'Helena Montenegro Castro',
      logradouro: 'Rua Ji-Paraná',
      numero: '512',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      cep: '76900-010',
    },
    {
      nome: 'Amazon Empreendimentos e Participações S/A',
      email: 'diretoria@amazonempreendimentos.com.br',
      telefone: '(69) 3421-8800',
      tipo: 'Jurídica',
      cpfCnpj: '18.452.910/0001-44',
      cnpj: '18.452.910/0001-44',
      razaoSocial: 'Amazon Empreendimentos e Participações S/A',
      banco: 'Bradesco',
      agencia: '2240',
      conta: '55610-8',
      tipoConta: 'Corrente',
      chavePix: '18.452.910/0001-44',
      titularConta: 'Amazon Empreendimentos e Participações S/A',
      logradouro: 'Av. Marechal Rondon',
      numero: '1500',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      cep: '76900-015',
    },
    {
      nome: 'Geraldo Magela Fontoura',
      email: 'magela.fontoura@agropecuaria.com.br',
      telefone: '(69) 99912-3322',
      tipo: 'Física',
      cpfCnpj: '456.789.012-23',
      rg: '389102-SSP/RO',
      profissao: 'Produtor Rural e Engenheiro Agrônomo',
      estadoCivil: 'Casado(a)',
      banco: 'Sicoob',
      agencia: '3325',
      conta: '44512-3',
      tipoConta: 'Corrente',
      chavePix: 'magela.fontoura@agropecuaria.com.br',
      titularConta: 'Geraldo Magela Fontoura',
      logradouro: 'Linha 94 - Gleba 05',
      numero: 'S/N',
      bairro: 'Zona Rural',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      cep: '76900-890',
    },
    {
      nome: 'Marieta Albuquerque Lins',
      email: 'marieta.lins@educacao.com.br',
      telefone: '(69) 99366-5544',
      tipo: 'Física',
      cpfCnpj: '567.890.123-34',
      rg: '490123-SSP/RO',
      profissao: 'Professora Universitária',
      estadoCivil: 'Viúvo(a)',
      banco: 'Santander',
      agencia: '1050',
      conta: '99201-4',
      tipoConta: 'Corrente',
      chavePix: '(69) 99366-5544',
      titularConta: 'Marieta Albuquerque Lins',
      logradouro: 'Rua Clóvis Arraes',
      numero: '840',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      cep: '76900-022',
    },
    {
      nome: 'Rondônia Logística e Armazéns Gerais Ltda',
      email: 'financeiro@rondolog.com.br',
      telefone: '(69) 3423-1100',
      tipo: 'Jurídica',
      cpfCnpj: '25.981.442/0001-89',
      cnpj: '25.981.442/0001-89',
      razaoSocial: 'Rondônia Logística e Armazéns Gerais Ltda',
      banco: 'Itaú',
      agencia: '0450',
      conta: '77890-2',
      tipoConta: 'Corrente',
      chavePix: '25.981.442/0001-89',
      titularConta: 'Rondônia Logística e Armazéns Gerais Ltda',
      logradouro: 'Rodovia BR-364 - Km 340',
      numero: '2500',
      bairro: 'Distrito Industrial',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      cep: '76900-990',
    },
  ];

  for (const p of novosProprietarios) {
    if (!existingPropNomes.has(p.nome)) {
      await execute(`
        INSERT INTO proprietarios (nome, email, telefone, tipo, cpfCnpj, rg, cnpj, razaoSocial, profissao, estadoCivil, banco, agencia, conta, tipoConta, chavePix, titularConta, logradouro, numero, bairro, cidade, uf, cep)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.nome, p.email, p.telefone, p.tipo, p.cpfCnpj, p.rg || null, p.cnpj || null, p.razaoSocial || null, p.profissao || null, p.estadoCivil || null, p.banco, p.agencia, p.conta, p.tipoConta, p.chavePix, p.titularConta, p.logradouro, p.numero, p.bairro, p.cidade, p.uf, p.cep]);
    }
  }

  // 4. Novos Clientes
  const existingClientes = await queryAll(`SELECT nome FROM clientes`);
  const existingCliNomes = new Set(existingClientes.map(c => c.nome));

  const novosClientes = [
    {
      nome: 'Arthur Henrique Medeiros',
      email: 'arthur.medeiros@gmail.com',
      telefone: '(69) 99312-7788',
      tipo: 'Comprador',
      origem: 'Portal Imobiliário',
      cpfCnpj: '321.456.789-01',
      dataNascimento: '1987-05-19',
      sexo: 'Masculino',
      profissao: 'Bancário / Gerente de Negócios',
      renda: 14500,
      estadoCivil: 'Casado(a)',
      cep: '76900-110',
      logradouro: 'Av. Marechal Rondon',
      numero: '950',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Compra',
      tipoImovelBusca: 'Apartamento',
      faixaMin: 400000,
      faixaMax: 650000,
      quartosBusca: 3,
      banheirosBusca: 2,
      bairroBusca: 'Centro',
      observacoes: 'Busca apartamento novo com 2 vagas de garagem e sacada gourmet.',
    },
    {
      nome: 'Priscila Dornelles Albuquerque',
      email: 'priscila.dornelles@hotmail.com',
      telefone: '(69) 99255-4433',
      tipo: 'Inquilino',
      origem: 'Instagram',
      cpfCnpj: '432.567.890-12',
      dataNascimento: '1992-10-12',
      sexo: 'Feminino',
      profissao: 'Farmacêutica Bioquímica',
      renda: 9800,
      estadoCivil: 'Solteiro(a)',
      cep: '76900-220',
      logradouro: 'Rua São Luiz',
      numero: '340',
      bairro: 'Dois de Abril',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Aluguel',
      tipoImovelBusca: 'Apartamento',
      faixaMin: 1800,
      faixaMax: 3200,
      quartosBusca: 2,
      banheirosBusca: 1,
      bairroBusca: 'Dois de Abril',
      observacoes: 'Interesse imediato em imóvel mobiliado ou semi-mobiliado.',
    },
    {
      nome: 'Fernando Caldeira Bastos',
      email: 'fernando.bastos@agroforte.com.br',
      telefone: '(69) 99988-1122',
      tipo: 'Comprador',
      origem: 'Indicação',
      cpfCnpj: '543.678.901-23',
      dataNascimento: '1979-02-24',
      sexo: 'Masculino',
      profissao: 'Empresário do Agronegócio',
      renda: 35000,
      estadoCivil: 'Casado(a)',
      cep: '76901-080',
      logradouro: 'Rua dos Ipês',
      numero: '120',
      bairro: 'Urupá',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Compra',
      tipoImovelBusca: 'Casa em Condomínio',
      faixaMin: 800000,
      faixaMax: 1600000,
      quartosBusca: 4,
      banheirosBusca: 4,
      bairroBusca: 'Urupá',
      observacoes: 'Deseja casa com amplo lazer, piscina aquecida e segurança 24h.',
    },
    {
      nome: 'Cláudia Regina Guimarães',
      email: 'claudia.guimaraes@tce.ro.gov.br',
      telefone: '(69) 99344-9900',
      tipo: 'Comprador',
      origem: 'Site Urbânia',
      cpfCnpj: '654.789.012-34',
      dataNascimento: '1984-11-03',
      sexo: 'Feminino',
      profissao: 'Auditora Fiscal',
      renda: 22000,
      estadoCivil: 'Divorciado(a)',
      cep: '76900-015',
      logradouro: 'Av. 22 de Novembro',
      numero: '1410',
      bairro: 'Casa Preta',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Compra',
      tipoImovelBusca: 'Apartamento',
      faixaMin: 550000,
      faixaMax: 900000,
      quartosBusca: 3,
      banheirosBusca: 3,
      bairroBusca: 'Centro',
      observacoes: 'Preferência por andar alto com vista livre e churrasqueira na varanda.',
    },
    {
      nome: 'Rodrigo Santiago de Holanda',
      email: 'rodrigo.holanda@gmail.com',
      telefone: '(69) 99222-8811',
      tipo: 'Inquilino',
      origem: 'Placa no Local',
      cpfCnpj: '765.890.123-45',
      dataNascimento: '1995-04-16',
      sexo: 'Masculino',
      profissao: 'Analista de Sistemas',
      renda: 11000,
      estadoCivil: 'Solteiro(a)',
      cep: '76900-330',
      logradouro: 'Rua T-10',
      numero: '780',
      bairro: 'Nova Brasília',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Aluguel',
      tipoImovelBusca: 'Casa',
      faixaMin: 2200,
      faixaMax: 3800,
      quartosBusca: 3,
      banheirosBusca: 2,
      bairroBusca: 'Nova Brasília',
      observacoes: 'Trabalho home office, precisa de cômodo privativo para escritório.',
    },
    {
      nome: 'Julio Cesar Mantovani',
      email: 'julio.mantovani@comercial.com.br',
      telefone: '(69) 99933-2211',
      tipo: 'Investidor',
      origem: 'Indicação',
      cpfCnpj: '876.901.234-56',
      dataNascimento: '1975-08-30',
      sexo: 'Masculino',
      profissao: 'Investidor e Comerciante',
      renda: 42000,
      estadoCivil: 'Casado(a)',
      cep: '76900-020',
      logradouro: 'Av. Transcontinental',
      numero: '1100',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Investimento / Locação Comercial',
      tipoImovelBusca: 'Sala Comercial',
      faixaMin: 300000,
      faixaMax: 850000,
      quartosBusca: 0,
      banheirosBusca: 2,
      bairroBusca: 'Centro',
      observacoes: 'Busca salas comerciais para locação corporativa com retorno acima de 0.6% a.m.',
    },
    {
      nome: 'Tatiane Ramos Figueira',
      email: 'tatiane.figueira@odontologia.com.br',
      telefone: '(69) 99311-6655',
      tipo: 'Comprador',
      origem: 'Site Urbânia',
      cpfCnpj: '987.012.345-67',
      dataNascimento: '1988-01-22',
      sexo: 'Feminino',
      profissao: 'Cirurgiã Dentista',
      renda: 19500,
      estadoCivil: 'Casado(a)',
      cep: '76900-140',
      logradouro: 'Rua Almirante Barroso',
      numero: '615',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Compra',
      tipoImovelBusca: 'Casa',
      faixaMin: 600000,
      faixaMax: 950000,
      quartosBusca: 3,
      banheirosBusca: 3,
      bairroBusca: 'Dois de Abril',
      observacoes: 'Preferência por casa térrea com quintal amplo e espaço gourmet.',
    },
    {
      nome: 'Bruno Carvalho Fagundes',
      email: 'bruno.fagundes@techsolutions.com',
      telefone: '(69) 99244-1199',
      tipo: 'Inquilino',
      origem: 'Google Ads',
      cpfCnpj: '098.123.456-78',
      dataNascimento: '1996-09-08',
      sexo: 'Masculino',
      profissao: 'Desenvolvedor Full Stack',
      renda: 13000,
      estadoCivil: 'Solteiro(a)',
      cep: '76900-090',
      logradouro: 'Rua Seis de Maio',
      numero: '810',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Aluguel',
      tipoImovelBusca: 'Apartamento',
      faixaMin: 2000,
      faixaMax: 3500,
      quartosBusca: 2,
      banheirosBusca: 2,
      bairroBusca: 'Centro',
      observacoes: 'Prioridade para imóvel com academia no condomínio e portaria remota/24h.',
    },
    {
      nome: 'Lorena Silveira Dantas',
      email: 'lorena.dantas@mp.ro.gov.br',
      telefone: '(69) 99977-3344',
      tipo: 'Comprador',
      origem: 'Indicação',
      cpfCnpj: '109.234.567-89',
      dataNascimento: '1982-12-14',
      sexo: 'Feminino',
      profissao: 'Promotora de Justiça',
      renda: 32000,
      estadoCivil: 'Casado(a)',
      cep: '76901-200',
      logradouro: 'Av. Ji-Paraná',
      numero: '1580',
      bairro: 'Urupá',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Compra',
      tipoImovelBusca: 'Casa em Condomínio',
      faixaMin: 900000,
      faixaMax: 1800000,
      quartosBusca: 4,
      banheirosBusca: 4,
      bairroBusca: 'Urupá',
      observacoes: 'Busca alto padrão, condomínio fechado de altíssima segurança.',
    },
    {
      nome: 'Gustavo Paes de Barros',
      email: 'gustavo.barros@transamazon.com.br',
      telefone: '(69) 99322-8877',
      tipo: 'Interessado',
      origem: 'Feira Imobiliária',
      cpfCnpj: '210.345.678-90',
      dataNascimento: '1990-06-25',
      sexo: 'Masculino',
      profissao: 'Gerente de Logística',
      renda: 16000,
      estadoCivil: 'Casado(a)',
      cep: '76900-450',
      logradouro: 'Rua T-20',
      numero: '920',
      bairro: 'Nova Brasília',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Compra',
      tipoImovelBusca: 'Casa',
      faixaMin: 450000,
      faixaMax: 700000,
      quartosBusca: 3,
      banheirosBusca: 2,
      bairroBusca: 'Dois de Abril',
      observacoes: 'Aceita imóvel usado caso esteja em bom estado de conservação.',
    },
    {
      nome: 'Renata Beltrão Naccache',
      email: 'renata.naccache@hospital.com.br',
      telefone: '(69) 99288-5522',
      tipo: 'Inquilino',
      origem: 'Instagram',
      cpfCnpj: '321.098.765-43',
      dataNascimento: '1994-03-05',
      sexo: 'Feminino',
      profissao: 'Médica Pediatra',
      renda: 24000,
      estadoCivil: 'Solteiro(a)',
      cep: '76900-010',
      logradouro: 'Av. Marechal Rondon',
      numero: '1120',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Aluguel',
      tipoImovelBusca: 'Apartamento',
      faixaMin: 3000,
      faixaMax: 5000,
      quartosBusca: 3,
      banheirosBusca: 3,
      bairroBusca: 'Centro',
      observacoes: 'Precisa de vaga privativa coberta e proximidade com o Hospital Municipal.',
    },
    {
      nome: 'Engenharia & Soluções Norte Ltda',
      email: 'contato@engenharanorte.com.br',
      telefone: '(69) 3422-9900',
      tipo: 'Inquilino',
      origem: 'Indicação',
      cpfCnpj: '33.882.114/0001-72',
      dataNascimento: '2015-08-10',
      sexo: 'Outro',
      profissao: 'Empresa de Engenharia Consultiva',
      renda: 85000,
      estadoCivil: 'Não informado',
      cep: '76900-030',
      logradouro: 'Av. Brasil',
      numero: '3100',
      bairro: 'Nova Brasília',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      finalidade: 'Aluguel Comercial',
      tipoImovelBusca: 'Sala Comercial',
      faixaMin: 4000,
      faixaMax: 9000,
      quartosBusca: 0,
      banheirosBusca: 3,
      bairroBusca: 'Centro',
      observacoes: 'Contrato PJ de 36 meses para instalação de escritório regional.',
    },
  ];

  for (const c of novosClientes) {
    if (!existingCliNomes.has(c.nome)) {
      await execute(`
        INSERT INTO clientes (nome, email, telefone, tipo, origem, cpfCnpj, dataNascimento, sexo, profissao, renda, estadoCivil, cep, logradouro, numero, bairro, cidade, uf, finalidade, tipoImovelBusca, faixaMin, faixaMax, quartosBusca, banheirosBusca, bairroBusca, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [c.nome, c.email, c.telefone, c.tipo, c.origem, c.cpfCnpj, c.dataNascimento, c.sexo, c.profissao, c.renda, c.estadoCivil, c.cep, c.logradouro, c.numero, c.bairro, c.cidade, c.uf, c.finalidade, c.tipoImovelBusca, c.faixaMin, c.faixaMax, c.quartosBusca, c.banheirosBusca, c.bairroBusca, c.observacoes]);
    }
  }

  // Obter listas atualizadas para relacionamentos
  const allClientes = await queryAll(`SELECT id, nome, cpfCnpj, telefone FROM clientes`);
  const allProprietarios = await queryAll(`SELECT id, nome, chavePix, banco, agencia, conta FROM proprietarios`);
  const allCorretores = await queryAll(`SELECT id, nome FROM funcionarios WHERE cargo = 'Corretor' OR cargo = 'Administrador'`);

  // 5. Novos Imóveis
  const existingImoveis = await queryAll(`SELECT titulo FROM imoveis`);
  const existingImovTitulos = new Set(existingImoveis.map(i => i.titulo));

  const novosImoveis = [
    {
      tipo: 'Apartamento',
      finalidade: 'Venda e Aluguel',
      proprietarioId: allProprietarios[0]?.id || 1,
      responsavelId: allCorretores[0]?.id || 3,
      responsavel: allCorretores[0]?.nome || 'Carlos Mendes',
      titulo: 'Residencial Boulevard - Apartamento Alto Padrão 3 Suítes',
      descricao: 'Excelente apartamento com acabamento em porcelanato, sacada gourmet integrada à sala e 3 suítes plenas. Condomínio com piscina aquecida, academia moderna e salão de festas.',
      cep: '76900-010',
      logradouro: 'Av. Marechal Rondon',
      numero: '820',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 680000,
      precoAluguel: 3600,
      condominio: 550,
      iptu: 1100,
      areaTotal: 145,
      areaTerreno: 0,
      quartos: 3,
      suites: 3,
      banheiros: 4,
      vagas: 2,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Casa',
      finalidade: 'Venda',
      proprietarioId: allProprietarios[1]?.id || 2,
      responsavelId: allCorretores[1]?.id || 4,
      responsavel: allCorretores[1]?.nome || 'Mariana Silva',
      titulo: 'Casa Contemporânea com Espaço Gourmet e Piscina no Bairro Urupá',
      descricao: 'Casa térrea com pé direito duplo, iluminação toda em LED, energia solar instalada, 3 suítes, escritório e ampla área gourmet com churrasqueira e piscina com cascata.',
      cep: '76901-120',
      logradouro: 'Rua das Mangueiras',
      numero: '145',
      bairro: 'Urupá',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 950000,
      precoAluguel: 0,
      condominio: 0,
      iptu: 1400,
      areaTotal: 280,
      areaTerreno: 450,
      quartos: 4,
      suites: 3,
      banheiros: 4,
      vagas: 3,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Apartamento',
      finalidade: 'Aluguel',
      proprietarioId: allProprietarios[2]?.id || 1,
      responsavelId: allCorretores[2]?.id || 3,
      responsavel: allCorretores[2]?.nome || 'Carlos Mendes',
      titulo: 'Apartamento 2 Quartos Mobiliado no Dois de Abril',
      descricao: 'Apartamento totalmente mobiliado e climatizado, perfeito para profissionais ou casais. Cozinha equipada com geladeira inox, fogão e micro-ondas. Lavanderia e vaga coberta.',
      cep: '76900-220',
      logradouro: 'Rua São Luiz',
      numero: '450',
      bairro: 'Dois de Abril',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 0,
      precoAluguel: 2400,
      condominio: 320,
      iptu: 650,
      areaTotal: 72,
      areaTerreno: 0,
      quartos: 2,
      suites: 1,
      banheiros: 2,
      vagas: 1,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Casa em Condomínio',
      finalidade: 'Venda e Aluguel',
      proprietarioId: allProprietarios[3]?.id || 2,
      responsavelId: allCorretores[3]?.id || 4,
      responsavel: allCorretores[3]?.nome || 'Mariana Silva',
      titulo: 'Mansão Ecológica em Condomínio Fechado Ville Royale',
      descricao: 'Imóvel de alto padrão com projeto assinado, automação residencial completa, 4 suítes master com closet e hidro, energia fotovoltaica e poço semi-artesiano.',
      cep: '76901-300',
      logradouro: 'Alameda dos Nobres',
      numero: '12',
      bairro: 'Dois de Abril',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 1450000,
      precoAluguel: 6500,
      condominio: 680,
      iptu: 2100,
      areaTotal: 380,
      areaTerreno: 600,
      quartos: 5,
      suites: 4,
      banheiros: 5,
      vagas: 4,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Sala Comercial',
      finalidade: 'Aluguel',
      proprietarioId: allProprietarios[0]?.id || 1,
      responsavelId: allCorretores[0]?.id || 3,
      responsavel: allCorretores[0]?.nome || 'Carlos Mendes',
      titulo: 'Conjunto Comercial Corporativo no Edifício Prime Tower',
      descricao: 'Sala comercial pronta para uso com piso elevado, forro acústico mineral, copa integrada, recepção e 2 banheiros privativos. 2 vagas de garagem exclusivas no subsolo.',
      cep: '76900-015',
      logradouro: 'Av. Marechal Rondon',
      numero: '1250',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 0,
      precoAluguel: 4800,
      condominio: 620,
      iptu: 850,
      areaTotal: 110,
      areaTerreno: 0,
      quartos: 0,
      suites: 0,
      banheiros: 2,
      vagas: 2,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Casa',
      finalidade: 'Venda',
      proprietarioId: allProprietarios[1]?.id || 2,
      responsavelId: allCorretores[1]?.id || 4,
      responsavel: allCorretores[1]?.nome || 'Mariana Silva',
      titulo: 'Residência Familiar 3 Quartos com Amplo Quintal no Jardim dos Migrantes',
      descricao: 'Charmosa casa aconchegante em rua asfaltada e tranquila. Sala de estar e jantar integradas, copa, varanda frontal arborizada e quintal nos fundos com edícula.',
      cep: '76900-210',
      logradouro: 'Rua T-12',
      numero: '415',
      bairro: 'Jardim dos Migrantes',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 480000,
      precoAluguel: 0,
      condominio: 0,
      iptu: 890,
      areaTotal: 175,
      areaTerreno: 360,
      quartos: 3,
      suites: 1,
      banheiros: 2,
      vagas: 2,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Cobertura',
      finalidade: 'Venda',
      proprietarioId: allProprietarios[2]?.id || 1,
      responsavelId: allCorretores[2]?.id || 3,
      responsavel: allCorretores[2]?.nome || 'Carlos Mendes',
      titulo: 'Cobertura Duplex com Vista Panorâmica para o Rio Machado',
      descricao: 'Exclusiva cobertura com terraço privativo, piscina com deck de madeira e espaço gourmet climatizado. 4 amplas suítes e 3 vagas de garagem.',
      cep: '76900-025',
      logradouro: 'Av. Brasil',
      numero: '700',
      bairro: 'Centro',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 1250000,
      precoAluguel: 0,
      condominio: 950,
      iptu: 2400,
      areaTotal: 295,
      areaTerreno: 0,
      quartos: 4,
      suites: 4,
      banheiros: 5,
      vagas: 3,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502005229762-ee1b2b93e08f?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Terreno',
      finalidade: 'Venda',
      proprietarioId: allProprietarios[3]?.id || 2,
      responsavelId: allCorretores[0]?.id || 3,
      responsavel: allCorretores[0]?.nome || 'Carlos Mendes',
      titulo: 'Terreno Comercial de Esquina na Av. Transcontinental (BR-364)',
      descricao: 'Excelente lote de esquina com 900 m², topografia 100% plana, ideal para concessionária, posto de combustível, atacarejo ou galpão logístico.',
      cep: '76900-050',
      logradouro: 'Av. Transcontinental',
      numero: '2540',
      bairro: 'Casa Preta',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 750000,
      precoAluguel: 0,
      condominio: 0,
      iptu: 1600,
      areaTotal: 900,
      areaTerreno: 900,
      quartos: 0,
      suites: 0,
      banheiros: 0,
      vagas: 0,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Sobrado',
      finalidade: 'Venda e Aluguel',
      proprietarioId: allProprietarios[4]?.id || 1,
      responsavelId: allCorretores[1]?.id || 4,
      responsavel: allCorretores[1]?.nome || 'Mariana Silva',
      titulo: 'Sobrado Moderno com 3 Suítes no Bairro Dois de Abril',
      descricao: 'Sobrado com arquitetura geométrica moderna, piso superior privativo com 3 suítes e sala íntima. Térreo integrado com cozinha americana e churrasqueira.',
      cep: '76900-240',
      logradouro: 'Rua Mato Grosso',
      numero: '890',
      bairro: 'Dois de Abril',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 780000,
      precoAluguel: 3900,
      condominio: 0,
      iptu: 1150,
      areaTotal: 220,
      areaTerreno: 300,
      quartos: 3,
      suites: 3,
      banheiros: 4,
      vagas: 2,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=800&q=80',
      ]),
    },
    {
      tipo: 'Sala Comercial',
      finalidade: 'Aluguel',
      proprietarioId: allProprietarios[5]?.id || 2,
      responsavelId: allCorretores[2]?.id || 3,
      responsavel: allCorretores[2]?.nome || 'Carlos Mendes',
      titulo: 'Sala Térrea Comercial na Av. Brasil com Grande Fluxo',
      descricao: 'Ponto comercial consolidado com vitrine em vidro temperado de 8 metros, porta de enrolar automática, mezanino metálico e estacionamento frontal para clientes.',
      cep: '76900-000',
      logradouro: 'Av. Brasil',
      numero: '1850',
      bairro: 'Nova Brasília',
      cidade: 'Ji-Paraná',
      uf: 'RO',
      precoVenda: 0,
      precoAluguel: 5200,
      condominio: 0,
      iptu: 1300,
      areaTotal: 160,
      areaTerreno: 200,
      quartos: 0,
      suites: 0,
      banheiros: 2,
      vagas: 3,
      fotos: JSON.stringify([
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
      ]),
    },
  ];

  for (const im of novosImoveis) {
    if (!existingImovTitulos.has(im.titulo)) {
      await execute(`
        INSERT INTO imoveis (tipo, finalidade, proprietarioId, responsavelId, responsavel, titulo, descricao, cep, logradouro, numero, bairro, cidade, uf, precoVenda, precoAluguel, condominio, iptu, areaTotal, areaTerreno, quartos, suites, banheiros, vagas, fotos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [im.tipo, im.finalidade, im.proprietarioId, im.responsavelId, im.responsavel, im.titulo, im.descricao, im.cep, im.logradouro, im.numero, im.bairro, im.cidade, im.uf, im.precoVenda, im.precoAluguel, im.condominio, im.iptu, im.areaTotal, im.areaTerreno, im.quartos, im.suites, im.banheiros, im.vagas, im.fotos]);
    }
  }

  // Recarregar dados após inserts
  const allImoveis = await queryAll(`SELECT id, titulo, proprietarioId, finalidade, precoVenda, precoAluguel, condominio, iptu FROM imoveis`);
  const freshClientes = await queryAll(`SELECT id, nome FROM clientes`);
  const freshCorretores = await queryAll(`SELECT id, nome FROM funcionarios WHERE cargo = 'Corretor' OR cargo = 'Administrador'`);
  const freshProprietarios = await queryAll(`SELECT id, nome, chavePix FROM proprietarios`);

  const getCli = (idx) => freshClientes[idx % freshClientes.length];
  const getImv = (idx) => allImoveis[idx % allImoveis.length];
  const getCorr = (idx) => freshCorretores[idx % freshCorretores.length];
  const getProp = (id) => freshProprietarios.find(p => p.id === id) || freshProprietarios[0];

  // 6. Novas Negociações
  const negCount = (await queryOne(`SELECT COUNT(*) as c FROM negociacoes`)).c;
  if (negCount <= 2) {
    console.log('Inserindo 10 negociações realistas com links perfeitos aos clientes e corretores...');
    const negociacoesData = [
      {
        cliIdx: 0,
        imvIdx: 2,
        corrIdx: 0,
        tipo: 'Locação',
        data: '2026-09-28',
        valor: 3500.00,
        status: 'Em Andamento',
        formaPagamento: 'Boleto Bancário',
        observacoes: 'Cliente ofertou R$ 3.500/mês com carência de 15 dias para mudança. Proprietário avaliando.',
      },
      {
        cliIdx: 2,
        imvIdx: 3,
        corrIdx: 1,
        tipo: 'Venda',
        data: '2026-09-29',
        valor: 920000.00,
        status: 'Em Andamento',
        formaPagamento: 'À Vista (PIX / Transferência)',
        observacoes: 'Proposta com pagamento de 50% à vista e saldo em 30 dias na lavratura da escritura pública.',
      },
      {
        cliIdx: 3,
        imvIdx: 4,
        corrIdx: 2,
        tipo: 'Locação',
        data: '2026-09-30',
        valor: 2300.00,
        status: 'Aprovada',
        formaPagamento: 'Boleto Bancário',
        observacoes: 'Proposta aceita sem ressalvas pelo proprietário. Encaminhado para confecção do contrato de locação.',
      },
      {
        cliIdx: 4,
        imvIdx: 5,
        corrIdx: 3,
        tipo: 'Venda',
        data: '2026-09-26',
        valor: 1380000.00,
        status: 'Em Andamento',
        formaPagamento: 'Financiamento Bancário',
        observacoes: 'Entrada de R$ 400.000,00 e saldo restante a ser financiado junto ao Banco do Brasil.',
      },
      {
        cliIdx: 5,
        imvIdx: 6,
        corrIdx: 4,
        tipo: 'Locação',
        data: '2026-09-27',
        valor: 4500.00,
        status: 'Em Andamento',
        formaPagamento: 'Boleto Bancário',
        observacoes: 'Negociação para locação comercial de 36 meses. Solicitada carência de 30 dias para reforma de forro e divisórias.',
      },
      {
        cliIdx: 6,
        imvIdx: 7,
        corrIdx: 0,
        tipo: 'Venda',
        data: '2026-09-25',
        valor: 460000.00,
        status: 'Aprovada',
        formaPagamento: 'Financiamento Bancário',
        observacoes: 'Carta de crédito Caixa aprovada. Proprietário aceitou a contraproposta de R$ 460.000.',
      },
      {
        cliIdx: 7,
        imvIdx: 8,
        corrIdx: 1,
        tipo: 'Venda',
        data: '2026-09-22',
        valor: 1180000.00,
        status: 'Recusada',
        formaPagamento: 'Permuta + Saldo',
        observacoes: 'Proposta envolvia permuta de veículo e imóvel menor; proprietário recusou por preferir liquidez integral.',
      },
      {
        cliIdx: 8,
        imvIdx: 9,
        corrIdx: 2,
        tipo: 'Venda',
        data: '2026-10-01',
        valor: 710000.00,
        status: 'Em Andamento',
        formaPagamento: 'À Vista (PIX / Transferência)',
        observacoes: 'Comprador solicitou certidões negativas de ônus e ações reipersecutórias antes do fechamento.',
      },
      {
        cliIdx: 9,
        imvIdx: 10,
        corrIdx: 3,
        tipo: 'Locação',
        data: '2026-09-29',
        valor: 3700.00,
        status: 'Em Andamento',
        formaPagamento: 'Boleto Bancário',
        observacoes: 'Inquilino ofereceu garantia de caução no valor de 3 aluguéis (R$ 11.100). Em análise cadastral.',
      },
      {
        cliIdx: 10,
        imvIdx: 11,
        corrIdx: 4,
        tipo: 'Locação',
        data: '2026-10-01',
        valor: 5000.00,
        status: 'Em Andamento',
        formaPagamento: 'Boleto Bancário',
        observacoes: 'Ponto comercial disputado. Cliente aceitou o valor integral solicitado pelo proprietário.',
      },
    ];

    for (const neg of negociacoesData) {
      const c = getCli(neg.cliIdx);
      const im = getImv(neg.imvIdx);
      const corr = getCorr(neg.corrIdx);
      const p = getProp(im.proprietarioId);

      await execute(`
        INSERT INTO negociacoes (clienteId, clienteNome, imovelId, imovelTitulo, proprietarioId, proprietarioNome, corretorId, corretor, tipo, data, valor, status, formaPagamento, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [c.id, c.nome, im.id, im.titulo, p.id, p.nome, corr.id, corr.nome, neg.tipo, neg.data, neg.valor, neg.status, neg.formaPagamento, neg.observacoes]);
    }
  }

  // 7. Novas Visitas
  const visCount = (await queryOne(`SELECT COUNT(*) as c FROM visitas`)).c;
  if (visCount <= 2) {
    console.log('Inserindo 12 visitas diversificadas...');
    const visitasData = [
      { cliIdx: 1, imvIdx: 0, corrIdx: 0, data: '2026-10-02', hora: '10:00', status: 'Confirmada', descricao: 'Primeira visita com o casal para conhecer o Residencial Boulevard e áreas comuns.' },
      { cliIdx: 2, imvIdx: 1, corrIdx: 1, data: '2026-10-02', hora: '14:30', status: 'Confirmada', descricao: 'Visita técnica com engenheiro da cliente para conferir estrutura e acabamentos.' },
      { cliIdx: 3, imvIdx: 2, corrIdx: 2, data: '2026-10-02', hora: '16:00', status: 'Confirmada', descricao: 'Visita agendada para locação residencial; cliente quer ver móveis planejados.' },
      { cliIdx: 4, imvIdx: 3, corrIdx: 3, data: '2026-10-03', hora: '09:00', status: 'Pendente', descricao: 'Aguardando confirmação do proprietário para liberação da portaria do condomínio.' },
      { cliIdx: 5, imvIdx: 4, corrIdx: 4, data: '2026-10-03', hora: '11:00', status: 'Confirmada', descricao: 'Visita comercial para avaliar implantação de escritório de advocacia.' },
      { cliIdx: 6, imvIdx: 5, corrIdx: 0, data: '2026-10-03', hora: '15:00', status: 'Pendente', descricao: 'Interesse em conferir espaço de quintal para futura ampliação de edícula.' },
      { cliIdx: 7, imvIdx: 6, corrIdx: 1, data: '2026-09-28', hora: '16:30', status: 'Realizada', descricao: 'Visita realizada com sucesso; cliente elogiou a vista panorâmica do terraço.' },
      { cliIdx: 8, imvIdx: 7, corrIdx: 2, data: '2026-09-27', hora: '10:30', status: 'Realizada', descricao: 'Visita ao terreno comercial; medição de testada realizada.' },
      { cliIdx: 9, imvIdx: 8, corrIdx: 3, data: '2026-09-26', hora: '14:00', status: 'Cancelada', descricao: 'Cliente precisou viajar a trabalho; visita será reagendada para a próxima semana.' },
      { cliIdx: 10, imvIdx: 9, corrIdx: 4, data: '2026-10-04', hora: '09:30', status: 'Confirmada', descricao: 'Apresentação da sala térrea comercial para franqueado do ramo alimentício.' },
      { cliIdx: 11, imvIdx: 1, corrIdx: 0, data: '2026-10-04', hora: '15:30', status: 'Confirmada', descricao: 'Segunda visita com a família inteira para definição de proposta formal.' },
      { cliIdx: 0, imvIdx: 3, corrIdx: 1, data: '2026-10-05', hora: '10:00', status: 'Pendente', descricao: 'Visita matutina para verificar incidência de sol na área da piscina.' },
    ];

    for (const v of visitasData) {
      const c = getCli(v.cliIdx);
      const im = getImv(v.imvIdx);
      const corr = getCorr(v.corrIdx);

      await execute(`
        INSERT INTO visitas (clienteId, clienteNome, imovelId, imovelTitulo, corretorId, corretor, data, hora, status, descricao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [c.id, c.nome, im.id, im.titulo, corr.id, corr.nome, v.data, v.hora, v.status, v.descricao]);
    }
  }

  // 8. Novos Contratos
  const ctCount = (await queryOne(`SELECT COUNT(*) as c FROM contratos`)).c;
  if (ctCount <= 2) {
    console.log('Inserindo 10 contratos completos com valores, vigências e garantias...');
    const contratosData = [
      {
        cliIdx: 1,
        imvIdx: 2,
        corrIdx: 0,
        tipo: 'Locação',
        status: 'Ativo',
        finalidade: 'Residencial',
        dataInicio: '2026-03-01',
        dataFim: '2027-02-28',
        dataAssinatura: '2026-02-25',
        valor: 3600.00,
        condominio: 550.00,
        iptu: 110.00,
        diaVencimento: 10,
        formaPagamento: 'Boleto Bancário',
        taxaAdministracao: 10.0,
        repasseProprietario: 3240.00,
        garantiaTipo: 'Caução em Dinheiro',
        garantiaValor: 10800.00,
        garantiaDetalhes: 'Depósito caução equivalente a 3 meses de aluguel em conta poupança vinculada.',
        indiceReajuste: 'IPCA',
        multaAtraso: 2.0,
        multaRescisoria: '3 meses de aluguel proporcionais ao tempo restante.',
        observacoes: 'Contrato residencial com vistoria de entrada acompanhada de laudo fotográfico em anexo.',
      },
      {
        cliIdx: 3,
        imvIdx: 4,
        corrIdx: 1,
        tipo: 'Locação',
        status: 'Ativo',
        finalidade: 'Residencial',
        dataInicio: '2026-05-01',
        dataFim: '2027-04-30',
        dataAssinatura: '2026-04-20',
        valor: 2400.00,
        condominio: 320.00,
        iptu: 65.00,
        diaVencimento: 5,
        formaPagamento: 'Boleto Bancário',
        taxaAdministracao: 10.0,
        repasseProprietario: 2160.00,
        garantiaTipo: 'Seguro Fiança',
        garantiaValor: 2400.00,
        garantiaDetalhes: 'Apólice Porto Seguro Aluguel #882194 vigência 12 meses.',
        indiceReajuste: 'IPCA',
        multaAtraso: 2.0,
        multaRescisoria: '3 aluguéis proporcionais.',
        observacoes: 'Imóvel semi-mobiliado com termo de inventário de bens assinado pelas partes.',
      },
      {
        cliIdx: 5,
        imvIdx: 6,
        corrIdx: 2,
        tipo: 'Locação',
        status: 'Ativo',
        finalidade: 'Comercial',
        dataInicio: '2026-06-01',
        dataFim: '2029-05-31',
        dataAssinatura: '2026-05-25',
        valor: 4800.00,
        condominio: 620.00,
        iptu: 85.00,
        diaVencimento: 15,
        formaPagamento: 'Boleto Bancário',
        taxaAdministracao: 8.0,
        repasseProprietario: 4416.00,
        garantiaTipo: 'Fiador com Imóvel',
        garantiaValor: 0,
        garantiaDetalhes: 'Fiador proprietário do imóvel matriculado sob nº 24.102 no 1º CRI de Ji-Paraná.',
        indiceReajuste: 'IGP-M',
        multaAtraso: 2.0,
        multaRescisoria: '3 aluguéis proporcionais.',
        observacoes: 'Contrato comercial de 36 meses com carência inicial de 30 dias concedida.',
      },
      {
        cliIdx: 0,
        imvIdx: 3,
        corrIdx: 3,
        tipo: 'Compra e Venda',
        status: 'Ativo',
        finalidade: 'Residencial',
        dataInicio: '2026-08-15',
        dataFim: null,
        dataAssinatura: '2026-08-15',
        valor: 950000.00,
        condominio: 0,
        iptu: 1400.00,
        diaVencimento: null,
        formaPagamento: 'Financiamento Bancário',
        taxaAdministracao: 6.0,
        repasseProprietario: 893000.00,
        garantiaTipo: 'Sem Garantia / Não Aplicável',
        garantiaValor: 0,
        garantiaDetalhes: 'Alienação Fiduciária em favor do agente financeiro interveniente.',
        indiceReajuste: 'Fixo (Sem Reajuste)',
        multaAtraso: 0,
        multaRescisoria: 'Cláusula penal irrefutável de 10% sobre o montante inadimplido.',
        observacoes: 'Escritura pública em fase de registro no cartório de registro de imóveis competente.',
      },
      {
        cliIdx: 7,
        imvIdx: 5,
        corrIdx: 0,
        tipo: 'Locação',
        status: 'Ativo',
        finalidade: 'Residencial',
        dataInicio: '2026-01-10',
        dataFim: '2027-01-09',
        dataAssinatura: '2026-01-05',
        valor: 6500.00,
        condominio: 680.00,
        iptu: 210.00,
        diaVencimento: 10,
        formaPagamento: 'Boleto Bancário',
        taxaAdministracao: 10.0,
        repasseProprietario: 5850.00,
        garantiaTipo: 'Título de Capitalização',
        garantiaValor: 26000.00,
        garantiaDetalhes: 'Título Icatu Seguros no valor de 4 aluguéis.',
        indiceReajuste: 'IPCA',
        multaAtraso: 2.0,
        multaRescisoria: '3 aluguéis proporcionais.',
        observacoes: 'Locação residencial de luxo em condomínio fechado com piscina privativa.',
      },
      {
        cliIdx: 9,
        imvIdx: 10,
        corrIdx: 1,
        tipo: 'Locação',
        status: 'Ativo',
        finalidade: 'Residencial',
        dataInicio: '2026-07-01',
        dataFim: '2027-06-30',
        dataAssinatura: '2026-06-25',
        valor: 3900.00,
        condominio: 0,
        iptu: 115.00,
        diaVencimento: 10,
        formaPagamento: 'Boleto Bancário',
        taxaAdministracao: 10.0,
        repasseProprietario: 3510.00,
        garantiaTipo: 'Caução em Dinheiro',
        garantiaValor: 11700.00,
        garantiaDetalhes: '3 aluguéis caucionados em conta de rendimentos.',
        indiceReajuste: 'IPCA',
        multaAtraso: 2.0,
        multaRescisoria: '3 aluguéis proporcionais.',
        observacoes: 'Sobrado em excelente localização no bairro Dois de Abril.',
      },
      {
        cliIdx: 11,
        imvIdx: 11,
        corrIdx: 2,
        tipo: 'Locação',
        status: 'Ativo',
        finalidade: 'Comercial',
        dataInicio: '2026-04-01',
        dataFim: '2029-03-31',
        dataAssinatura: '2026-03-25',
        valor: 5200.00,
        condominio: 0,
        iptu: 130.00,
        diaVencimento: 20,
        formaPagamento: 'Boleto Bancário',
        taxaAdministracao: 8.0,
        repasseProprietario: 4784.00,
        garantiaTipo: 'Fiança Bancária',
        garantiaValor: 31200.00,
        garantiaDetalhes: 'Carta de fiança emitida pelo Banco Santander com prazo de 36 meses.',
        indiceReajuste: 'IPCA',
        multaAtraso: 2.0,
        multaRescisoria: '3 meses de aluguel proporcionais.',
        observacoes: 'Contrato comercial de ponto nobre na Av. Brasil.',
      },
      {
        cliIdx: 6,
        imvIdx: 7,
        corrIdx: 3,
        tipo: 'Compra e Venda',
        status: 'Finalizado',
        finalidade: 'Residencial',
        dataInicio: '2026-02-10',
        dataFim: null,
        dataAssinatura: '2026-02-10',
        valor: 480000.00,
        condominio: 0,
        iptu: 890.00,
        diaVencimento: null,
        formaPagamento: 'Financiamento Bancário',
        taxaAdministracao: 6.0,
        repasseProprietario: 451200.00,
        garantiaTipo: 'Sem Garantia / Não Aplicável',
        garantiaValor: 0,
        garantiaDetalhes: null,
        indiceReajuste: 'Fixo (Sem Reajuste)',
        multaAtraso: 0,
        multaRescisoria: '10% de multa.',
        observacoes: 'Transação concluída e chaves entregues aos novos proprietários.',
      },
    ];

    for (const ct of contratosData) {
      const c = getCli(ct.cliIdx);
      const im = getImv(ct.imvIdx);
      const corr = getCorr(ct.corrIdx);
      const p = getProp(im.proprietarioId);

      await execute(`
        INSERT INTO contratos (
          clienteId, clienteNome, imovelId, imovelTitulo, proprietarioId, proprietarioNome,
          corretorId, corretor, tipo, status, finalidade, dataInicio, dataFim, dataAssinatura,
          valor, condominio, iptu, diaVencimento, formaPagamento, taxaAdministracao,
          repasseProprietario, garantiaTipo, garantiaValor, garantiaDetalhes,
          indiceReajuste, multaAtraso, multaRescisoria, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        c.id, c.nome, im.id, im.titulo, p.id, p.nome,
        corr.id, corr.nome, ct.tipo, ct.status, ct.finalidade, ct.dataInicio, ct.dataFim, ct.dataAssinatura,
        ct.valor, ct.condominio, ct.iptu, ct.diaVencimento, ct.formaPagamento, ct.taxaAdministracao,
        ct.repasseProprietario, ct.garantiaTipo, ct.garantiaValor, ct.garantiaDetalhes,
        ct.indiceReajuste, ct.multaAtraso, ct.multaRescisoria, ct.observacoes
      ]);
    }
  }

  // 9. Lançamentos Financeiros adicionais
  const finCount = (await queryOne(`SELECT COUNT(*) as c FROM financeiro`)).c;
  if (finCount <= 7) {
    console.log('Inserindo 12 novos lançamentos financeiros...');
    const allContratos = await queryAll(`SELECT * FROM contratos`);
    const lancamentos = [
      {
        tipo: 'Receita',
        categoria: 'Aluguel de Imóvel',
        descricao: 'Aluguel Mensal - Residencial Boulevard #3 (Setembro/2026)',
        valor: 3600.00,
        dataVencimento: '2026-09-10',
        dataPagamento: '2026-09-09',
        status: 'Pago',
        formaPagamento: 'Boleto Bancário',
        contratoIdx: 2,
        reciboNumero: 'REC-20260909-03',
      },
      {
        tipo: 'Receita',
        categoria: 'Taxa de Administração',
        descricao: 'Honorários de Gestão Locatícia (10%) - Contrato #3',
        valor: 360.00,
        dataVencimento: '2026-09-10',
        dataPagamento: '2026-09-09',
        status: 'Pago',
        formaPagamento: 'Retenção Automática',
        contratoIdx: 2,
        reciboNumero: 'REC-20260909-04',
      },
      {
        tipo: 'Repasse',
        categoria: 'Repasse ao Proprietário',
        descricao: 'Repasse Líquido de Aluguel - Dr. Valdir Antunes Meireles',
        valor: 3240.00,
        dataVencimento: '2026-09-15',
        dataPagamento: '2026-09-15',
        status: 'Pago',
        formaPagamento: 'PIX',
        contratoIdx: 2,
        reciboNumero: 'REP-20260915-02',
      },
      {
        tipo: 'Receita',
        categoria: 'Aluguel de Imóvel',
        descricao: 'Aluguel Mensal - Conjunto Comercial Edifício Prime Tower (Setembro/2026)',
        valor: 4800.00,
        dataVencimento: '2026-09-15',
        dataPagamento: '2026-09-14',
        status: 'Pago',
        formaPagamento: 'Boleto Bancário',
        contratoIdx: 4,
        reciboNumero: 'REC-20260914-05',
      },
      {
        tipo: 'Repasse',
        categoria: 'Repasse ao Proprietário',
        descricao: 'Repasse Líquido de Locação Comercial - Prime Tower',
        valor: 4416.00,
        dataVencimento: '2026-09-20',
        dataPagamento: '2026-09-20',
        status: 'Pago',
        formaPagamento: 'PIX',
        contratoIdx: 4,
        reciboNumero: 'REP-20260920-03',
      },
      {
        tipo: 'Receita',
        categoria: 'Comissão de Venda',
        descricao: 'Comissão de Venda Imóvel #4 - Bairro Urupá (6%)',
        valor: 57000.00,
        dataVencimento: '2026-09-15',
        dataPagamento: '2026-09-15',
        status: 'Pago',
        formaPagamento: 'Transferência Bancária',
        contratoIdx: 5,
        reciboNumero: 'REC-20260915-06',
      },
      {
        tipo: 'Receita',
        categoria: 'Aluguel de Imóvel',
        descricao: 'Aluguel Mensal - Residencial Boulevard (Competência Outubro/2026)',
        valor: 3600.00,
        dataVencimento: '2026-10-10',
        dataPagamento: null,
        status: 'Pendente',
        formaPagamento: 'Boleto Bancário',
        contratoIdx: 2,
      },
      {
        tipo: 'Repasse',
        categoria: 'Repasse ao Proprietário',
        descricao: 'Repasse Líquido Previsto - Competência Outubro (Dr. Valdir)',
        valor: 3240.00,
        dataVencimento: '2026-10-15',
        dataPagamento: null,
        status: 'Pendente',
        formaPagamento: 'PIX',
        contratoIdx: 2,
      },
      {
        tipo: 'Receita',
        categoria: 'Aluguel de Imóvel',
        descricao: 'Aluguel Comercial - Ponto Nobre Av. Brasil (Outubro/2026)',
        valor: 5200.00,
        dataVencimento: '2026-10-20',
        dataPagamento: null,
        status: 'Pendente',
        formaPagamento: 'Boleto Bancário',
        contratoIdx: 6,
      },
      {
        tipo: 'Despesa',
        categoria: 'Manutenção de imóveis sob gestão',
        descricao: 'Substituição de bomba de recalque d’água e revisão hidrossanitária',
        valor: 1150.00,
        dataVencimento: '2026-10-08',
        dataPagamento: null,
        status: 'Pendente',
        formaPagamento: 'PIX',
        contratoIdx: 2,
      },
      {
        tipo: 'Despesa',
        categoria: 'Administrativa',
        descricao: 'Assessoria Jurídica Mensal e Suporte Notarial',
        valor: 2500.00,
        dataVencimento: '2026-10-10',
        dataPagamento: null,
        status: 'Pendente',
        formaPagamento: 'Boleto Bancário',
      },
      {
        tipo: 'Despesa',
        categoria: 'Marketing e Divulgação',
        descricao: 'Impulsionamento de Campanhas no Facebook Ads e Google Imóveis',
        valor: 1800.00,
        dataVencimento: '2026-10-15',
        dataPagamento: null,
        status: 'Pendente',
        formaPagamento: 'Cartão de Crédito',
      },
    ];

    for (const lan of lancamentos) {
      const ct = lan.contratoIdx !== undefined && allContratos[lan.contratoIdx % allContratos.length];
      await execute(`
        INSERT INTO financeiro (
          tipo, categoria, descricao, valor, dataVencimento, dataPagamento, status,
          formaPagamento, clienteId, clienteNome, imovelId, imovelTitulo,
          proprietarioId, proprietarioNome, contratoId, reciboNumero, data, operador
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        lan.tipo, lan.categoria, lan.descricao, lan.valor, lan.dataVencimento, lan.dataPagamento || null,
        lan.status, lan.formaPagamento,
        ct ? ct.clienteId : null, ct ? ct.clienteNome : null,
        ct ? ct.imovelId : null, ct ? ct.imovelTitulo : null,
        ct ? ct.proprietarioId : null, ct ? ct.proprietarioNome : null,
        ct ? ct.id : null, lan.reciboNumero || null,
        lan.dataPagamento || lan.dataVencimento, 'Carlos Mendes'
      ]);
    }
  }

  // 10. Despesas adicionais
  const despCount = (await queryOne(`SELECT COUNT(*) as c FROM despesas`)).c;
  if (despCount <= 3) {
    console.log('Inserindo despesas operacionais...');
    await execute(`
      INSERT INTO despesas (descricao, valor, dataVencimento, dataPagamento, status, categoria, imovelId, imovelTitulo, formaPagamento, observacoes)
      VALUES
        ('Licenças de Software de CRM e Assinatura Eletrônica DocuSign', 890.00, '2026-10-05', '2026-10-05', 'Pago', 'Administrativa', null, null, 'Cartão de Crédito', 'Renovação anual da plataforma de assinaturas digitais.'),
        ('Serviços de Fotografia Profissional e Tour Virtual 360º', 1200.00, '2026-10-12', null, 'Pendente', 'Marketing', 1, 'Residencial Boulevard - Apartamento Alto Padrão 3 Suítes', 'PIX', 'Fotos em alta resolução para os portais ZAP e VivaReal.'),
        ('Limpeza e Conservação Predial da Sede da Imobiliária', 1450.00, '2026-10-10', null, 'Pendente', 'Administrativa', null, null, 'Transferência Bancária', 'Contrato terceirizado de limpeza mensal.')
    `);
  }

  // 11. Prestadores de Serviço e Reparos
  const prestCount = (await queryOne(`SELECT COUNT(*) as c FROM prestadores`)).c;
  if (prestCount <= 2) {
    console.log('Inserindo prestadores de serviço...');
    await execute(`
      INSERT INTO prestadores (nome, razaoSocial, cpfCnpj, email, telefone, pais, uf, cidade, bairro, logradouro, numero, servicos, especialidade, banco, agencia, conta, tipoChavePix, chavePix)
      VALUES
        ('Marcos Encanador & Hidráulica Express', null, '345.678.901-22', 'marcos.hidraulica@gmail.com', '(69) 99388-1144', 'Brasil', 'RO', 'Ji-Paraná', 'Centro', 'Rua Paraná', '120', '[2]', 'Desentupimento e vazamentos', 'Bradesco', '1240', '33410-1', 'Celular', '(69) 99388-1144'),
        ('Climatiza Rondônia Ar Condicionado', 'Climatiza Soluções Térmicas Ltda', '19.452.100/0001-33', 'contato@climatizaro.com.br', '(69) 3421-9988', 'Brasil', 'RO', 'Ji-Paraná', 'Nova Brasília', 'Av. Brasil', '1400', '[1]', 'Climatização e Elétrica', 'Banco do Brasil', '0840', '55120-4', 'CNPJ', '19.452.100/0001-33')
    `);
  }

  const repCount = (await queryOne(`SELECT COUNT(*) as c FROM reparos`)).c;
  if (repCount <= 1) {
    console.log('Inserindo reparos vinculados...');
    await execute(`
      INSERT INTO reparos (imovelId, servicoId, prestadorId, responsavelId, responsavel, descricao, dataSolicitacao, status, valor)
      VALUES
        (2, 2, 3, 3, 'Carlos Mendes', 'Vazamento na válvula de descarga do banheiro social e troca de sifão da pia.', '2026-09-30', 'Em Andamento', 250.00),
        (3, 1, 4, 4, 'Mariana Silva', 'Higienização e recarga de gás em 3 aparelhos de ar-condicionado Split Inverter.', '2026-10-01', 'Pendente', 600.00)
    `);
  }

  // 12. Multas
  const multasCount = (await queryOne(`SELECT COUNT(*) as c FROM multas`)).c;
  if (multasCount <= 2) {
    console.log('Inserindo multas adicionais de exemplo...');
    await execute(`
      INSERT INTO multas (contratoId, clienteId, clienteNome, motivo, tipo, modoValor, valor, percentual, valorCalculado, dataAplicacao, dataVencimento, status)
      VALUES
        (3, 3, 'Arthur Henrique Medeiros', 'Atraso de 5 dias na liquidação do boleto de condomínio rateado.', 'Atraso no pagamento', 'Percentual (%)', 48.00, 2.0, 48.00, '2026-09-20', '2026-10-10', 'Pendente')
    `);
  }

  console.log('População de dados concluída com absoluto sucesso!');
  process.exit(0);
}

run().catch(err => {
  console.error('Erro na população:', err);
  process.exit(1);
});
