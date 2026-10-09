// Dados de teste variados para TODOS os módulos do sistema.
// Roda sozinho quando o servidor sobe com o banco vazio (ex.: Render, que apaga o SQLite a cada deploy).
// Para gerar de novo no seu computador: npm run resetar-banco (apaga o banco) e depois npm start.
//
// Os valores são "aleatórios", mas com semente fixa: todo banco gerado fica igual (bom para testes e prints).
// As datas são relativas ao dia em que o banco é criado (visitas futuras, aluguéis do mês etc.).
const { garantirAcessosPadrao } = require('./permissoes');

// ===== Aleatoriedade com semente fixa (mulberry32) =====
let semente = 2026;
const aleatorio = () => {
  semente = (semente + 0x6D2B79F5) | 0;
  let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entre = (min, max) => Math.floor(aleatorio() * (max - min + 1)) + min;
const um = lista => lista[Math.floor(aleatorio() * lista.length)];
const chance = p => aleatorio() < p;
const arredonda = (v, passo) => Math.round(v / passo) * passo;
const embaralha = lista => [...lista].sort(() => aleatorio() - 0.5);

// ===== Datas relativas a hoje =====
const HOJE = new Date();
const iso = d => d.toISOString().slice(0, 10);
const dia = offset => { const d = new Date(HOJE); d.setDate(d.getDate() + offset); return iso(d); };
const mes = (offsetMeses, diaDoMes) => { const d = new Date(HOJE.getFullYear(), HOJE.getMonth() + offsetMeses, diaDoMes, 12); return iso(d); };
const hora = () => `${String(entre(8, 17)).padStart(2, '0')}:${um(['00', '15', '30', '45'])}`;
const dataHora = offset => `${dia(offset)} ${hora()}`;

// ===== Documentos com dígitos verificadores válidos =====
const digitos = n => Array.from({ length: n }, () => entre(0, 9));
const cpf = () => {
  const n = digitos(9);
  for (const peso of [10, 11]) {
    const soma = n.reduce((s, d, i) => s + d * (peso - i), 0);
    n.push((soma * 10) % 11 % 10);
  }
  const s = n.join('');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
};
const cnpj = () => {
  const n = [...digitos(8), 0, 0, 0, 1];
  for (const pesos of [[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]]) {
    const resto = n.reduce((s, d, i) => s + d * pesos[i], 0) % 11;
    n.push(resto < 2 ? 0 : 11 - resto);
  }
  const s = n.join('');
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`;
};
const rg = () => `${entre(1000000, 1999999)}`;
const celular = () => `(69) 9${entre(8100, 9999)}-${String(entre(0, 9999)).padStart(4, '0')}`;
const fixo = () => `(69) 34${entre(10, 29)}-${String(entre(0, 9999)).padStart(4, '0')}`;
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ===== Listas de nomes e lugares =====
const NOMES_F = ['Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Luana', 'Mariana', 'Natália', 'Patrícia', 'Rafaela', 'Sabrina', 'Tatiane', 'Vanessa', 'Yasmin', 'Aline', 'Bruna', 'Cláudia', 'Débora', 'Elaine', 'Joana', 'Letícia', 'Priscila'];
const NOMES_M = ['André', 'Bruno', 'Carlos', 'Diego', 'Eduardo', 'Felipe', 'Gustavo', 'Henrique', 'Igor', 'João', 'Leonardo', 'Lucas', 'Marcelo', 'Mateus', 'Nicolas', 'Otávio', 'Paulo', 'Rafael', 'Rodrigo', 'Samuel', 'Thiago', 'Vinícius', 'Wesley', 'Yuri', 'Enzo', 'Fábio', 'Jonas', 'Ricardo'];
const SOBRENOMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos', 'Teixeira', 'Brito', 'Prado', 'Batista'];
const PROFISSOES = ['Professor(a)', 'Enfermeiro(a)', 'Engenheiro(a) Civil', 'Advogado(a)', 'Médico(a)', 'Analista de Sistemas', 'Comerciante', 'Servidor(a) Público(a)', 'Contador(a)', 'Agrônomo(a)', 'Empresário(a)', 'Vendedor(a)', 'Dentista', 'Policial', 'Autônomo(a)', 'Arquiteto(a)', 'Farmacêutico(a)', 'Motorista'];
const BAIRROS = ['Centro', 'Nova Brasília', 'Jardim Aurélio Bernardi', 'Urupá', 'Dois de Abril', 'Jardim dos Migrantes', 'Casa Preta', 'Primavera', 'São Francisco', 'Jardim Presidencial', 'Riachuelo', 'Novo Ji-Paraná', 'Vila Jotão', 'Bosque dos Ipês', 'Jardim Capelasso'];
const RUAS = ['Av. Marechal Rondon', 'Av. Brasil', 'Av. Transcontinental', 'Rua T-15', 'Rua Seis de Maio', 'Av. Aracaju', 'Rua Padre Adolpho Rohl', 'Rua Rio Grande do Sul', 'Av. Dois de Abril', 'Rua Menezes Filho', 'Rua Curitiba', 'Rua Martins Costa', 'Av. Ji-Paraná', 'Rua dos Ipês', 'Rua Goiânia', 'Rua Maringá', 'Rua Sete de Setembro', 'Rua Monte Castelo'];
const CIDADES_VIZINHAS = [['Porto Velho', 'RO', '76801'], ['Cacoal', 'RO', '76960'], ['Ouro Preto do Oeste', 'RO', '76920'], ['Ariquemes', 'RO', '76870'], ['Presidente Médici', 'RO', '76916']];
const BANCOS = ['Banco do Brasil', 'Caixa Econômica Federal', 'Itaú', 'Bradesco', 'Santander', 'Sicoob', 'Sicredi', 'Nubank', 'Inter'];
const EMAIL_DOMINIOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'uol.com.br'];

const usados = new Set();
const pessoa = (sexo = chance(0.5) ? 'Feminino' : 'Masculino') => {
  let nome;
  do {
    const primeiro = um(sexo === 'Feminino' ? NOMES_F : NOMES_M);
    nome = `${primeiro} ${um(SOBRENOMES)}${chance(0.5) ? ' ' + um(SOBRENOMES) : ''}`;
  } while (usados.has(nome));
  usados.add(nome);
  return { nome, sexo };
};
const emailDe = (nome, dominio = um(EMAIL_DOMINIOS)) => {
  const p = semAcento(nome).split(' ');
  return `${p[0]}.${p[p.length - 1]}${chance(0.3) ? entre(1, 99) : ''}@${dominio}`;
};
const endereco = (local = true) => {
  if (local || chance(0.8)) {
    return { cep: `7690${entre(0, 9)}-${String(entre(0, 999)).padStart(3, '0')}`, logradouro: um(RUAS), numero: String(entre(10, 3200)), bairro: um(BAIRROS), cidade: 'Ji-Paraná', uf: 'RO', complemento: chance(0.25) ? um(['Apto 102', 'Casa 2', 'Fundos', 'Bloco B', 'Sala 3']) : null };
  }
  const [cidade, uf, cep] = um(CIDADES_VIZINHAS);
  return { cep: `${cep}-${String(entre(0, 999)).padStart(3, '0')}`, logradouro: um(RUAS), numero: String(entre(10, 3200)), bairro: 'Centro', cidade, uf, complemento: null };
};
const nascimento = (idadeMin, idadeMax) => dia(-entre(idadeMin * 365, idadeMax * 365));
const historico = (passos, usuario) => JSON.stringify(passos.map(([de, para, offset]) => ({ de, para, data: dataHora(offset), usuario })));

// Fotos de imóveis (Unsplash) separadas por estilo
const FOTO = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const FOTOS = {
  residencial: ['photo-1484154218962-a197022b5858', 'photo-1502005229762-ee1b2b93e08f', 'photo-1502672260266-1c1ef2d93688', 'photo-1512915922686-57c11dde9b6b', 'photo-1512917774080-9991f1c4c750', 'photo-1522708323590-d24dbb6b0267', 'photo-1560448204-e02f11c3d0e2', 'photo-1568605117036-5fe5e7bab0b7', 'photo-1576941089067-2de3c901e126', 'photo-1580587771525-78b9dba3b914', 'photo-1598228723793-52759bba239c', 'photo-1600585154340-be6161a56a0c', 'photo-1600596542815-ffad4c1539a9', 'photo-1613977257363-707ba9348227'],
  comercial: ['photo-1497215728101-856f4ea42174', 'photo-1497366216548-37526070297c', 'photo-1497366811353-6870744d04b2'],
  rural: ['photo-1500382017468-9049fed747ef', 'photo-1568605117036-5fe5e7bab0b7', 'photo-1600585154340-be6161a56a0c'],
};

// Características de cada tipo de imóvel (faixas de preço em R$)
const TIPOS = {
  Apartamento: { venda: [260000, 780000], aluguel: [1300, 3800], area: [55, 140], quartos: [1, 4], fotos: 'residencial', finalidades: ['Venda', 'Venda', 'Aluguel', 'Aluguel', 'Aluguel', 'Venda e Aluguel', 'Temporada'] },
  Casa: { venda: [320000, 1250000], aluguel: [1500, 5200], area: [90, 320], quartos: [2, 5], fotos: 'residencial', finalidades: ['Venda', 'Aluguel', 'Aluguel', 'Venda e Aluguel'] },
  Cobertura: { venda: [850000, 1900000], aluguel: [4500, 8500], area: [150, 320], quartos: [3, 5], fotos: 'residencial', finalidades: ['Venda', 'Venda e Aluguel'] },
  Studio: { venda: [180000, 290000], aluguel: [1100, 1900], area: [28, 45], quartos: [1, 1], fotos: 'residencial', finalidades: ['Aluguel', 'Aluguel', 'Venda', 'Temporada'] },
  Kitnet: { venda: [110000, 180000], aluguel: [650, 1150], area: [22, 35], quartos: [1, 1], fotos: 'residencial', finalidades: ['Aluguel'] },
  Chácara: { venda: [420000, 1600000], aluguel: [2500, 6000], area: [1500, 20000], quartos: [2, 5], fotos: 'rural', finalidades: ['Venda', 'Venda', 'Temporada'] },
  'Sala Comercial': { venda: [240000, 650000], aluguel: [1800, 6500], area: [35, 220], quartos: [0, 0], fotos: 'comercial', finalidades: ['Aluguel', 'Venda', 'Venda e Aluguel'] },
};
const ADJETIVOS = {
  Apartamento: ['com Varanda Gourmet', 'Mobiliado no Centro', 'com Vista Panorâmica', 'Próximo ao Shopping', 'em Condomínio com Lazer', 'Reformado'],
  Casa: ['Térrea com Piscina', 'em Condomínio Fechado', 'com Quintal Amplo', 'Recém-Construída', 'com Área Gourmet', 'de Esquina'],
  Cobertura: ['Duplex com Terraço', 'com Piscina Privativa', 'de Alto Padrão'],
  Studio: ['Compacto e Moderno', 'Mobiliado Próximo à Faculdade', 'Novo com Lavanderia'],
  Kitnet: ['Mobiliada', 'Próxima ao IFRO', 'com Garagem'],
  Chácara: ['com Pomar e Represa', 'com Casa Sede', 'para Lazer na BR-364'],
  'Sala Comercial': ['no Centro Comercial', 'Térrea com Vitrine', 'em Edifício Empresarial', 'com Estacionamento'],
};

// ===== Inserção =====
module.exports = async function popularDadosDeTeste(db) {
  const run = (sql, params = []) => new Promise((resolve, reject) =>
    db.run(sql, params, function(err) { return err ? reject(err) : resolve(this); }));

  // Insere só as colunas que existem na tabela e devolve o registro com o id gerado
  const inserir = async (tabela, dados) => {
    const colunas = Object.keys(dados).filter(k => k in db.schema[tabela] && dados[k] !== undefined);
    const r = await run(`INSERT INTO ${tabela} (${colunas.join(',')}) VALUES (${colunas.map(() => '?').join(',')})`, colunas.map(k => dados[k]));
    return { id: r.lastID, ...dados };
  };

  await run('BEGIN TRANSACTION');
  try {
    // ----- Configurações da imobiliária -----
    await inserir('configuracoes', {
      nomeFantasia: 'Urbânia', razaoSocial: 'Urbânia Gestão Imobiliária Ltda', cnpj: cnpj(), creci: '4521-J',
      telefone: '(69) 3421-5500', email: 'contato@urbania.com.br', site: 'https://urbania.com.br',
      cep: '76900-030', logradouro: 'Av. Marechal Rondon', numero: '1250', bairro: 'Centro', cidade: 'Ji-Paraná', uf: 'RO', complemento: 'Sala 4',
      taxaAdministracao: 10, comissaoVenda: 6, multaAtraso: 10, jurosDia: 0.033, diaVencimento: 10, indiceReajuste: 'IGP-M', prazoRepasse: 5,
    });

    // ----- Perfis de acesso -----
    const T = ['Visualizar', 'Criar', 'Editar', 'Excluir'];
    const perfis = [
      ['Administrador', 'Acesso total e irrestrito a todos os módulos, relatórios gerenciais e configurações do sistema.', {}, 1],
      ['Corretor', 'Operações imobiliárias: clientes, imóveis, visitas, negociações e anúncios.', {
        clientes: ['Visualizar', 'Criar', 'Editar'], proprietarios: ['Visualizar', 'Criar', 'Editar'], imoveis: ['Visualizar', 'Criar', 'Editar'],
        visitas: T, negociacoes: ['Visualizar', 'Criar', 'Editar'], contratos: ['Visualizar'], anuncios: ['Visualizar', 'Criar', 'Editar'],
        canais: ['Visualizar'], relatorios: ['Visualizar'],
      }, 1],
      ['Secretária', 'Atendimento ao público, recepção de clientes, agendamento de visitas e rotinas operacionais.', {
        clientes: ['Visualizar', 'Criar', 'Editar'], proprietarios: ['Visualizar'], imoveis: ['Visualizar'], visitas: T,
        notificacoes: ['Visualizar', 'Criar'], servicos: ['Visualizar'], prestadores: ['Visualizar'], reparos: ['Visualizar', 'Criar'],
        canais: ['Visualizar'], anuncios: ['Visualizar'],
      }, 0],
      ['Financeiro', 'Contas a pagar e a receber, repasses, multas e despesas da imobiliária.', {
        financeiro: T, despesas: T, multas: T, contratos: ['Visualizar', 'Editar'], clientes: ['Visualizar'], proprietarios: ['Visualizar'],
        imoveis: ['Visualizar'], reparos: ['Visualizar'], relatorios: ['Visualizar'],
      }, 0],
      ['Gerente Comercial', 'Supervisão da equipe comercial, contratos, divulgação e relatórios.', {
        clientes: T, proprietarios: T, imoveis: T, visitas: T, negociacoes: T, contratos: T, anuncios: T, canais: T,
        financeiro: ['Visualizar'], despesas: ['Visualizar'], multas: ['Visualizar', 'Criar'], servicos: T, prestadores: T, reparos: T,
        notificacoes: T, funcionarios: ['Visualizar'], relatorios: ['Visualizar'], auditoria: ['Visualizar'], configuracoes: ['Visualizar'],
      }, 0],
    ];
    const perfilId = {};
    for (const [nome, descricao, p, nativo] of perfis) {
      perfilId[nome] = (await inserir('perfis', { nome, descricao, permissoes: JSON.stringify(p), status: 'Ativo', nativo })).id;
    }

    // ----- Funcionários (e-mails fixos usados no acesso rápido e nos testes) -----
    const equipe = [
      ['Diretoria Urbânia (Admin)', 'admin@urbania.com.br', 'Administrador', 'Administrador', 15000],
      ['Fernanda Oliveira', 'fernanda@urbania.com.br', 'Secretária', 'Secretária', 2600],
      ['Carlos Mendes', 'carlos.mendes@urbania.com.br', 'Corretor', 'Corretor', 3200],
      ['Mariana Silva', 'mariana.silva@urbania.com.br', 'Corretor', 'Corretor', 3200],
      ['Rafael Fontes de Alencar', 'rafael.fontes@urbania.com.br', 'Corretor', 'Corretor', 3400],
      ['Juliana Camargo Peixoto', 'juliana.peixoto@urbania.com.br', 'Corretor', 'Corretor', 3000],
      ['Thiago Ramos Brito', 'thiago.brito@urbania.com.br', 'Corretor', 'Corretor', 3100],
      ['Letícia Nunes Andrade', 'leticia.andrade@urbania.com.br', 'Corretor', 'Corretor', 2900],
      ['Patrícia Moreira Lopes', 'patricia.lopes@urbania.com.br', 'Secretária', 'Secretária', 2500],
      ['Ricardo Teixeira Dias', 'ricardo.dias@urbania.com.br', 'Financeiro', 'Financeiro', 4800],
      ['Helena Prado Barbosa', 'helena.barbosa@urbania.com.br', 'Gerente', 'Gerente Comercial', 7200],
      ['Wesley Cardoso Freitas', 'wesley.freitas@urbania.com.br', 'Corretor', 'Corretor', 2900],
    ];
    const funcionarios = [];
    for (const [i, [nome, email, cargo, perfil, salario]] of equipe.entries()) {
      usados.add(nome);
      funcionarios.push(await inserir('funcionarios', {
        nome, cpf: cpf(), rg: rg(), orgaoEmissor: 'SSP/RO', dataNascimento: nascimento(23, 55), telefone: celular(), telefoneFixo: chance(0.4) ? fixo() : null,
        email, senha: 'urbania123', cargo, creci: cargo === 'Corretor' ? `CRECI-RO ${entre(3000, 9999)}-F` : null,
        // Corretores inativos para testar regras de validação e filtros de status
        status: (nome === 'Wesley Cardoso Freitas' || nome === 'Letícia Nunes Andrade') ? 'Inativo' : 'Ativo', dataAdmissao: dia(-entre(90, 1800)), salario, perfilId: perfilId[perfil],
        observacoes: cargo === 'Corretor' ? um(['Especialista em imóveis residenciais.', 'Foco em locação e administração.', 'Atende a região central e condomínios.', null]) : null,
        ...endereco(),
      }));
    }
    const corretores = funcionarios.filter(f => f.cargo === 'Corretor' && f.status === 'Ativo');
    const operadores = funcionarios.filter(f => ['Administrador', 'Financeiro', 'Secretária', 'Gerente'].includes(f.cargo));

    // ----- Proprietários (pessoas físicas e empresas) -----
    const proprietarios = [];
    const empresas = ['Construtora Alvorada Ltda', 'Rondon Empreendimentos Imobiliários', 'Ipê Participações S/A', 'Madeireira Vale do Machado Ltda', 'JP Investimentos e Patrimônio'];
    for (let i = 0; i < 18; i++) {
      const pj = i < empresas.length;
      const p = pj ? { nome: empresas[i], sexo: null } : pessoa();
      const doc = pj ? cnpj() : cpf();
      const email = pj ? `contato@${semAcento(p.nome).split(' ')[0]}.com.br` : emailDe(p.nome);
      proprietarios.push(await inserir('proprietarios', {
        nome: p.nome, email, telefone: celular(), tipo: pj ? 'Jurídica' : 'Física', cpfCnpj: doc, cnpj: pj ? doc : null, razaoSocial: pj ? p.nome : null,
        rg: pj ? null : rg(), dataNascimento: pj ? null : nascimento(30, 78), sexo: p.sexo, estadoCivil: pj ? null : um(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']),
        profissao: pj ? null : um(PROFISSOES), banco: um(BANCOS), agencia: String(entre(1000, 4999)), conta: `${entre(10000, 99999)}-${entre(0, 9)}`,
        tipoConta: chance(0.8) ? 'Corrente' : 'Poupança', chavePix: chance(0.5) ? email : doc, titularConta: p.nome, ...endereco(false),
      }));
    }

    // ----- Clientes -----
    const clientes = [];
    const empresasCliente = ['Clínica Vida Saudável', 'Escritório Contábil Precisão', 'Ótica Visão Clara', 'Academia Corpo em Forma', 'Loja Ponto Certo Calçados'];
    for (let i = 0; i < 42; i++) {
      const pj = i < empresasCliente.length;
      const p = pj ? { nome: empresasCliente[i], sexo: null } : pessoa();
      const tipo = pj ? 'Locatário' : um(['Comprador', 'Comprador', 'Locatário', 'Locatário', 'Interessado']);
      const finalidade = tipo === 'Comprador' ? 'Compra' : tipo === 'Locatário' ? 'Locação' : um(['Compra', 'Locação', 'Todos']);
      const tipoBusca = pj ? 'Sala Comercial' : um(['Apartamento', 'Casa', 'Sobrado', 'Cobertura', 'Chácara']);
      const compra = finalidade === 'Compra';
      const faixaMin = compra ? arredonda(entre(150000, 600000), 10000) : arredonda(entre(700, 2500), 100);
      clientes.push(await inserir('clientes', {
        nome: p.nome, email: pj ? `contato@${semAcento(p.nome).split(' ')[1] || 'empresa'}.com.br` : emailDe(p.nome), telefone: celular(), tipo,
        origem: um(['Site', 'Indicação', 'Redes Sociais', 'Telefone']), cpfCnpj: pj ? cnpj() : cpf(), rg: pj ? null : rg(),
        dataNascimento: pj ? null : nascimento(19, 72), sexo: p.sexo, profissao: pj ? null : um(PROFISSOES),
        renda: pj ? null : arredonda(entre(2200, 28000), 100), estadoCivil: pj ? null : um(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'União Estável']),
        ...endereco(false), finalidade, tipoImovelBusca: tipoBusca, areaMinima: entre(30, 150),
        faixaMin, faixaMax: arredonda(faixaMin * (compra ? 1.6 : 1.8), compra ? 10000 : 100),
        quartosBusca: tipoBusca === 'Sala Comercial' ? 0 : entre(1, 4), banheirosBusca: entre(1, 3), bairroBusca: chance(0.6) ? um(BAIRROS) : null,
        observacoes: chance(0.35) ? um(['Prefere imóveis com garagem coberta.', 'Possui pet de porte médio.', 'Precisa mudar até o fim do mês.', 'Busca imóvel próximo a escolas.', 'Aceita financiamento pela Caixa.', 'Quer visitar aos sábados.']) : null,
      }));
    }

    // ----- Serviços de manutenção -----
    const servicosBase = [
      ['Reparo elétrico', 'Troca de tomadas, disjuntores e revisão da fiação.', 'Elétrica'],
      ['Instalação de chuveiro e iluminação', 'Instalação de chuveiros, luminárias e ventiladores de teto.', 'Elétrica'],
      ['Desentupimento e vazamentos', 'Desentupimento de pias/ralos e conserto de vazamentos.', 'Hidráulica'],
      ['Troca de registros e torneiras', 'Substituição de registros, torneiras e reparos em caixas acopladas.', 'Hidráulica'],
      ['Pintura interna', 'Pintura de paredes e tetos, incluindo massa corrida.', 'Pintura'],
      ['Pintura de fachada', 'Lavagem e pintura de fachadas e muros externos.', 'Pintura'],
      ['Reparo de alvenaria', 'Correção de trincas, reboco e pequenos reparos estruturais.', 'Alvenaria'],
      ['Ajuste de portas e armários', 'Regulagem de dobradiças, troca de fechaduras e reparos em armários.', 'Marcenaria'],
      ['Portões e grades', 'Solda, ajuste e pintura de portões, grades e corrimãos.', 'Serralheria'],
      ['Limpeza pós-obra', 'Limpeza completa após reformas e antes da entrega do imóvel.', 'Limpeza'],
      ['Manutenção de jardim', 'Corte de grama, poda e limpeza de áreas verdes.', 'Jardinagem'],
      ['Higienização de ar-condicionado', 'Limpeza, carga de gás e manutenção preventiva de split.', 'Climatização'],
    ];
    const servicos = [];
    for (const [nome, descricao, categoria] of servicosBase) servicos.push(await inserir('servicos', { nome, descricao, categoria }));

    // ----- Prestadores -----
    const prestadoresBase = [
      ['João Eletricista', 'Elétrica'], ['Hidro Fácil Encanamentos', 'Hidráulica'], ['Pinturas Arco-Íris', 'Pintura'], ['Construsol Reformas', 'Alvenaria'],
      ['Marcenaria Bom Lenho', 'Marcenaria'], ['Serralheria Ferro Forte', 'Serralheria'], ['Brilho Total Limpezas', 'Limpeza'], ['Verde Vivo Jardinagem', 'Jardinagem'],
      ['Gelo Norte Climatização', 'Climatização'], ['Faz Tudo Manutenções', 'Elétrica'],
    ];
    const prestadores = [];
    for (const [nome, especialidade] of prestadoresBase) {
      const pj = !nome.startsWith('João');
      const doc = pj ? cnpj() : cpf();
      // Cada prestador atende os serviços da sua especialidade (o "Faz Tudo" atende várias)
      const ids = servicos.filter(s => s.categoria === especialidade || (nome.startsWith('Faz Tudo') && chance(0.5))).map(s => s.id);
      prestadores.push(await inserir('prestadores', {
        nome, razaoSocial: pj ? `${nome} Ltda` : null, cpfCnpj: doc, email: `${semAcento(nome).split(' ')[0]}@${pj ? 'empresa.com.br' : 'gmail.com'}`, telefone: celular(),
        pais: 'Brasil', ...endereco(), especialidade, servicos: JSON.stringify(ids), avaliacao: entre(35, 50) / 10,
        banco: um(BANCOS), agencia: String(entre(1000, 4999)), conta: `${entre(10000, 99999)}-${entre(0, 9)}`,
        tipoChavePix: pj ? 'CNPJ' : 'Celular', chavePix: pj ? doc : celular(),
      }));
    }

    // ----- Canais de publicação -----
    const canaisBase = [
      ['Site Urbânia', 'Site', 'Vitrine própria da imobiliária.'], ['Portal ZAP Imóveis', 'Anunciado', 'Plano com 20 anúncios ativos.'],
      ['Viva Real', 'Anunciado', 'Destaque mensal para imóveis de alto padrão.'], ['OLX Imóveis', 'Anunciado', 'Anúncios gratuitos com impulsionamento.'],
      ['Instagram @urbaniaimoveis', 'Site', 'Posts e stories semanais.'], ['Jornal Diário da Amazônia', 'Impresso', 'Classificados de domingo.'],
      ['Folheto de Bairro', 'Impresso', 'Distribuído em condomínios parceiros.'],
    ];
    const canais = [];
    for (const [nome, tipoCanal, observacoes] of canaisBase) canais.push(await inserir('canais', { nome, tipoCanal, observacoes }));

    // ----- Imóveis -----
    const imoveis = [];
    const distribuicao = ['Apartamento', 'Apartamento', 'Apartamento', 'Casa', 'Casa', 'Casa', 'Cobertura', 'Studio', 'Kitnet', 'Chácara', 'Sala Comercial', 'Sala Comercial'];
    for (let i = 0; i < 38; i++) {
      const tipo = um(distribuicao);
      const t = TIPOS[tipo];
      const finalidade = um(t.finalidades);
      const vende = finalidade.includes('Venda');
      const aluga = finalidade !== 'Venda';
      const area = entre(t.area[0], t.area[1]);
      const quartos = entre(t.quartos[0], t.quartos[1]);
      const corretor = um(corretores);
      const end = endereco();
      imoveis.push(await inserir('imoveis', {
        tipo, finalidade, titulo: `${tipo} ${quartos > 1 ? `${quartos} Quartos ` : ''}${um(ADJETIVOS[tipo])}`,
        descricao: `${tipo} no bairro ${end.bairro} com ${area} m²${quartos ? `, ${quartos} quarto(s)` : ''}. ${um(['Ótima iluminação natural e ventilação cruzada.', 'Acabamento em porcelanato e armários planejados.', 'Rua tranquila, próxima a comércio e escolas.', 'Documentação regularizada e pronta para financiamento.', 'Ambientes amplos e integrados.'])}`,
        proprietarioId: um(proprietarios).id, responsavelId: corretor.id, responsavel: corretor.nome, ...end,
        precoVenda: vende ? arredonda(entre(t.venda[0], t.venda[1]), 5000) : null,
        precoAluguel: aluga ? arredonda(entre(t.aluguel[0], t.aluguel[1]), 50) : null,
        condominio: ['Apartamento', 'Cobertura', 'Studio', 'Sala Comercial'].includes(tipo) ? arredonda(entre(180, 900), 10) : null,
        iptu: arredonda(entre(60, 450), 5), areaTotal: area, areaTerreno: ['Casa', 'Chácara'].includes(tipo) ? Math.round(area * (tipo === 'Chácara' ? 1 : 1.6)) : null,
        quartos, suites: quartos ? entre(0, Math.min(quartos, 3)) : 0, banheiros: Math.max(1, entre(1, quartos + 1)), vagas: tipo === 'Kitnet' ? entre(0, 1) : entre(1, 4),
        fotos: JSON.stringify(embaralha(FOTOS[t.fotos]).slice(0, entre(2, 3)).map(FOTO)),
      }));
    }
    const proprietarioDe = imovel => proprietarios.find(p => p.id === imovel.proprietarioId);

    // ----- Visitas (passadas e futuras) -----
    for (let i = 0; i < 75; i++) {
      const offset = entre(-75, 21);
      const cliente = um(clientes);
      const imovel = um(imoveis);
      const corretor = um(corretores);
      const status = offset < 0 ? (chance(0.8) ? 'Realizada' : 'Cancelada') : offset === 0 ? 'Confirmada' : (chance(0.55) ? 'Confirmada' : 'Pendente');
      await inserir('visitas', {
        clienteId: cliente.id, clienteNome: cliente.nome, imovelId: imovel.id, imovelTitulo: imovel.titulo, corretorId: corretor.id, corretor: corretor.nome,
        data: dia(offset), hora: hora(), status,
        descricao: status === 'Realizada' ? um(['Cliente gostou da localização.', 'Achou o imóvel pequeno para a família.', 'Pediu para rever com o cônjuge.', 'Interessado, vai enviar proposta.', 'Gostou, mas acha o valor alto.'])
          : status === 'Cancelada' ? um(['Cliente desmarcou por imprevisto.', 'Imóvel já negociado.', 'Não compareceu.']) : um(['Levar chaves da portaria.', 'Cliente vem de carro próprio.', null]),
      });
    }

    // ----- Negociações -----
    const negociacoes = [];
    for (let i = 0; i < 40; i++) {
      const imovel = um(imoveis);
      const cliente = um(clientes);
      const corretor = um(corretores);
      const tipo = imovel.finalidade === 'Temporada' ? 'Temporada' : imovel.precoVenda && (!imovel.precoAluguel || chance(0.5)) ? 'Venda' : 'Locação';
      const base = tipo === 'Venda' ? imovel.precoVenda : imovel.precoAluguel;
      // Locações fecham com mais frequência que vendas
      const status = tipo === 'Venda' ? um(['Em Andamento', 'Em Andamento', 'Realizada', 'Cancelada']) : um(['Em Andamento', 'Realizada', 'Realizada', 'Realizada', 'Cancelada']);
      const prop = proprietarioDe(imovel);
      negociacoes.push(await inserir('negociacoes', {
        clienteId: cliente.id, clienteNome: cliente.nome, imovelId: imovel.id, imovelTitulo: imovel.titulo, proprietarioId: prop.id, proprietarioNome: prop.nome,
        corretorId: corretor.id, corretor: corretor.nome, tipo, data: dia(-entre(1, 200)), status,
        valor: arredonda(base * (entre(88, 100) / 100), tipo === 'Venda' ? 1000 : 10),
        formaPagamento: tipo === 'Venda' ? um(['À Vista (PIX / Transferência)', 'Financiamento Bancário', 'Financiamento Bancário', 'Carta de Crédito / Consórcio', 'Parcelamento Direto com Proprietário', 'Permuta Parcial']) : 'Outro',
        observacoes: um(['Cliente pediu desconto à vista.', 'Proposta enviada por e-mail ao proprietário.', 'Aguardando aprovação do banco.', 'Proprietário aceitou contraproposta.', 'Cliente desistiu após nova visita.', null]),
      }));
    }

    // ----- Contratos (das negociações realizadas) -----
    const contratos = [];
    for (const n of negociacoes.filter(x => x.status === 'Realizada')) {
      const imovel = imoveis.find(x => x.id === n.imovelId);
      const tipo = n.tipo === 'Venda' ? 'Compra e Venda' : n.tipo;
      const locacao = tipo !== 'Compra e Venda';
      const inicioMeses = -entre(1, 14);
      const duracao = tipo === 'Temporada' ? 3 : 30;
      const vencido = locacao && mes(inicioMeses + duracao, 5) < iso(HOJE);
      const status = vencido ? 'Finalizado' : locacao ? um(['Ativo', 'Ativo', 'Ativo', 'Ativo', 'Ativo', 'Pendente', 'Rescindido']) : um(['Ativo', 'Finalizado', 'Finalizado']);
      const garantia = locacao ? um(['Caução em Dinheiro', 'Fiador', 'Seguro Fiança', 'Título de Capitalização']) : 'Sem Garantia / Não Aplicável';
      contratos.push(await inserir('contratos', {
        clienteId: n.clienteId, clienteNome: n.clienteNome, imovelId: n.imovelId, imovelTitulo: n.imovelTitulo, proprietarioId: n.proprietarioId, proprietarioNome: n.proprietarioNome,
        corretorId: n.corretorId, corretor: n.corretor, tipo, status, finalidade: imovel.tipo === 'Sala Comercial' ? 'Comercial' : imovel.tipo === 'Chácara' ? 'Industrial / Rural' : tipo === 'Temporada' ? 'Temporada' : 'Residencial',
        dataAssinatura: mes(inicioMeses, entre(1, 5)), dataInicio: mes(inicioMeses, 5), dataFim: locacao ? mes(inicioMeses + duracao, 5) : null,
        valor: n.valor, condominio: locacao ? imovel.condominio : null, iptu: locacao ? imovel.iptu : null, diaVencimento: locacao ? um([5, 10, 15, 20]) : null,
        formaPagamento: locacao ? um(['Boleto Bancário', 'PIX', 'Débito em Conta']) : um(['Transferência Bancária', 'PIX']),
        taxaAdministracao: locacao ? 10 : null, repasseProprietario: locacao ? arredonda(n.valor * 0.9, 1) : null,
        garantiaTipo: garantia, garantiaValor: garantia === 'Caução em Dinheiro' ? n.valor * 3 : garantia === 'Título de Capitalização' ? arredonda(n.valor * 4, 100) : null,
        garantiaDetalhes: garantia === 'Fiador' ? `Fiador: ${pessoa().nome}, CPF ${cpf()}` : garantia === 'Seguro Fiança' ? 'Apólice Porto Seguro nº ' + entre(100000, 999999) : null,
        indiceReajuste: locacao ? um(['IGP-M', 'IPCA', 'INPC']) : 'Fixo (Sem Reajuste)', multaAtraso: locacao ? 10 : null,
        multaRescisoria: locacao ? 'Três aluguéis, proporcional ao tempo restante' : null,
        observacoes: status === 'Rescindido' ? 'Rescindido a pedido do locatário por mudança de cidade.' : null,
        inicioMeses,
      }));
    }

    // ----- Financeiro (aluguéis, taxas, repasses, comissões e custos da empresa) -----
    let recibo = 1000;
    const lancar = (dados, offsetPagamento) => {
      const pago = dados.status === 'Pago';
      return inserir('financeiro', {
        ...dados, dataPagamento: pago ? (offsetPagamento || dados.dataVencimento) : null,
        reciboNumero: pago ? `URB-${HOJE.getFullYear()}-${recibo++}` : null, operador: pago ? um(operadores).nome : null, data: dados.dataVencimento,
      });
    };
    for (const c of contratos) {
      const ref = { clienteId: c.clienteId, clienteNome: c.clienteNome, proprietarioId: c.proprietarioId, proprietarioNome: c.proprietarioNome, imovelId: c.imovelId, imovelTitulo: c.imovelTitulo, contratoId: c.id };
      if (c.tipo === 'Compra e Venda') {
        await lancar({ ...ref, tipo: 'Receita', categoria: 'Comissão de Venda', descricao: `Comissão de venda (6%) - ${c.imovelTitulo}`, valor: arredonda(c.valor * 0.06, 1), dataVencimento: c.dataAssinatura, status: 'Pago', formaPagamento: 'Transferência Bancária' });
        continue;
      }
      if (c.status === 'Pendente') continue;
      // Até 4 últimos meses de aluguel, do mais antigo ao atual
      const meses = Math.min(4, -c.inicioMeses + 1);
      for (let m = -(meses - 1); m <= 0; m++) {
        const venc = mes(m, c.diaVencimento);
        const atual = m === 0;
        const vencido = venc < iso(HOJE);
        const status = c.status !== 'Ativo' && atual ? 'Cancelado' : !atual ? (chance(0.92) ? 'Pago' : 'Atrasado') : vencido ? um(['Pago', 'Atrasado']) : 'Pendente';
        const aluguel = await lancar({ ...ref, tipo: 'Receita', categoria: 'Aluguel de Imóvel', descricao: `Aluguel ${venc.slice(5, 7)}/${venc.slice(0, 4)} - ${c.imovelTitulo}`, valor: c.valor, dataVencimento: venc, status, formaPagamento: c.formaPagamento });
        if (aluguel.status !== 'Pago') continue;
        await lancar({ ...ref, tipo: 'Receita', categoria: 'Taxa de Administração', descricao: `Taxa de administração (10%) ${venc.slice(5, 7)}/${venc.slice(0, 4)}`, valor: arredonda(c.valor * 0.1, 0.01), dataVencimento: venc, status: 'Pago', formaPagamento: 'Retenção Automática' });
        const repasse = mes(m, Math.min(28, c.diaVencimento + 5));
        await lancar({ ...ref, tipo: 'Repasse', categoria: 'Repasse ao Proprietário', descricao: `Repasse ${venc.slice(5, 7)}/${venc.slice(0, 4)} - ${c.proprietarioNome}`, valor: c.repasseProprietario, dataVencimento: repasse, status: atual || (m === -1 && chance(0.5)) ? 'Pendente' : 'Pago', formaPagamento: 'PIX' });
      }
    }
    for (let m = -3; m <= 0; m++) {
      await lancar({ tipo: 'Despesa', categoria: 'Pessoal e Salários', descricao: `Folha de pagamento ${mes(m, 5).slice(5, 7)}`, valor: funcionarios.reduce((s, f) => s + (f.status === 'Ativo' ? f.salario : 0), 0), dataVencimento: mes(m, 5), status: mes(m, 5) < iso(HOJE) ? 'Pago' : 'Pendente', formaPagamento: 'Transferência Bancária' });
      await lancar({ tipo: 'Despesa', categoria: 'Marketing e Divulgação', descricao: `Plano mensal portais imobiliários ${mes(m, 12).slice(5, 7)}`, valor: 890, dataVencimento: mes(m, 12), status: mes(m, 12) < iso(HOJE) ? 'Pago' : 'Pendente', formaPagamento: 'Cartão de Crédito' });
    }
    await lancar({ tipo: 'Despesa', categoria: 'Impostos e Taxas', descricao: 'ISS e Simples Nacional do trimestre', valor: 3450.75, dataVencimento: dia(-6), status: 'Atrasado', formaPagamento: 'Boleto Bancário' });

    // ----- Despesas (controle de custos) -----
    const despesasBase = [
      ['Conta de energia elétrica da sede', 'Administrativa', [480, 720]], ['Internet fibra e telefonia', 'Administrativa', [250, 320]],
      ['Material de escritório e impressão', 'Administrativa', [150, 600]], ['Vale-transporte da equipe', 'Pessoal', [600, 1100]],
      ['Plano de saúde dos colaboradores', 'Pessoal', [1800, 2600]], ['Campanha Google Ads e Instagram', 'Marketing', [600, 1500]],
      ['Placas "Vende-se/Aluga-se"', 'Marketing', [300, 900]], ['Reparo em imóvel administrado', 'Manutenção de imóveis sob gestão', [250, 2200]],
      ['IPTU de imóvel desocupado', 'Impostos e taxas', [120, 450]], ['Contabilidade terceirizada', 'Serviços terceirizados', [900, 1400]],
      ['Sistema de assinatura digital', 'Serviços terceirizados', [120, 250]], ['Limpeza da sede', 'Outros', [350, 600]],
    ];
    for (let i = 0; i < 28; i++) {
      const [descricao, categoria, [min, max]] = despesasBase[i % despesasBase.length];
      const offset = entre(-80, 25);
      const status = offset > 0 ? 'Pendente' : chance(0.75) ? 'Pago' : 'Atrasado';
      const imovel = categoria.startsWith('Manutenção') || categoria === 'Impostos e taxas' ? um(imoveis) : null;
      const autor = um(operadores).nome;
      await inserir('despesas', {
        descricao, categoria, valor: arredonda(entre(min, max), 0.5), dataVencimento: dia(offset), dataPagamento: status === 'Pago' ? dia(offset - entre(0, 3)) : null, status,
        imovelId: imovel?.id ?? null, imovelTitulo: imovel?.titulo ?? null, formaPagamento: um(['Boleto Bancário', 'PIX', 'Cartão de Crédito', 'Débito em Conta']),
        observacoes: chance(0.3) ? um(['Pagamento aprovado pela diretoria.', 'Aguardando nota fiscal.', 'Valor reajustado neste mês.']) : null,
        historicoStatus: historico(status === 'Pago' ? [[null, 'Pendente', offset - 10], ['Pendente', 'Pago', offset]] : status === 'Atrasado' ? [[null, 'Pendente', offset - 10], ['Pendente', 'Atrasado', offset + 1]] : [[null, 'Pendente', -entre(0, 5)]], autor),
      });
    }

    // ----- Multas (contratos de locação) -----
    const locacoes = contratos.filter(c => c.tipo !== 'Compra e Venda');
    for (let i = 0; i < Math.min(14, locacoes.length * 2); i++) {
      const c = um(locacoes);
      const tipo = um(['Atraso no pagamento', 'Atraso no pagamento', 'Dano ao imóvel', 'Quebra de cláusula', 'Rescisão antecipada', 'Outros']);
      const percentual = tipo === 'Atraso no pagamento' || tipo === 'Rescisão antecipada';
      const pct = tipo === 'Rescisão antecipada' ? 100 : entre(2, 10);
      const valor = percentual ? 0 : arredonda(entre(150, 1800), 10);
      const status = um(['Pendente', 'Pendente', 'Pago', 'Contestado', 'Cancelado']);
      const offset = -entre(3, 90);
      await inserir('multas', {
        contratoId: c.id, clienteId: c.clienteId, clienteNome: c.clienteNome, tipo, modoValor: percentual ? 'Percentual (%)' : 'Fixo (R$)',
        valor, percentual: percentual ? pct : 0, valorCalculado: percentual ? arredonda(c.valor * pct / 100, 0.01) : valor,
        motivo: { 'Atraso no pagamento': 'Pagamento do aluguel realizado após o vencimento.', 'Dano ao imóvel': um(['Vidro da janela da sala quebrado.', 'Porta do banheiro danificada.', 'Manchas e furos nas paredes além do uso normal.']), 'Quebra de cláusula': 'Sublocação de cômodo sem autorização do proprietário.', 'Rescisão antecipada': 'Devolução do imóvel antes do prazo contratual.', Outros: 'Perda das chaves do portão e do controle remoto.' }[tipo],
        dataAplicacao: dia(offset), dataVencimento: dia(offset + 15), status,
        historicoStatus: historico([[null, 'Pendente', offset], ...(status !== 'Pendente' ? [['Pendente', status, offset + entre(1, 10)]] : [])], um(operadores).nome),
      });
    }

    // ----- Reparos -----
    for (let i = 0; i < 24; i++) {
      const servico = um(servicos);
      const prestador = prestadores.find(p => JSON.parse(p.servicos).includes(servico.id)) || um(prestadores);
      const responsavel = um(funcionarios.filter(f => f.status === 'Ativo'));
      const offset = -entre(0, 60);
      const status = offset > -7 ? um(['Pendente', 'Iniciado']) : um(['Iniciado', 'Finalizado', 'Finalizado', 'Finalizado']);
      await inserir('reparos', {
        imovelId: um(imoveis).id, servicoId: servico.id, prestadorId: prestador.id, responsavelId: responsavel.id, responsavel: responsavel.nome,
        descricao: `${servico.nome}: ${um(['solicitado pelo inquilino', 'identificado na vistoria', 'preparação para nova locação', 'pedido do proprietário', 'manutenção preventiva'])}.`,
        dataSolicitacao: dia(offset), status, valor: arredonda(entre(120, 2400), 10),
      });
    }

    // ----- Anúncios -----
    for (const imovel of embaralha(imoveis).slice(0, 30)) {
      for (const canal of embaralha(canais).slice(0, entre(1, 2))) {
        const status = um(['Ativo', 'Ativo', 'Ativo', 'Pausado', 'Encerrado']);
        const cliques = entre(15, 1200);
        await inserir('anuncios', {
          imovelId: imovel.id, canalId: canal.id, canal: canal.nome, dataPublicacao: dia(-entre(1, 120)), status, cliques, contatos: Math.round(cliques * entre(1, 8) / 100),
          valor: imovel.precoVenda || imovel.precoAluguel, fotos: imovel.fotos,
          descricao: `${imovel.titulo} no bairro ${imovel.bairro}. ${imovel.quartos ? `${imovel.quartos} quarto(s), ` : ''}${imovel.vagas} vaga(s), ${imovel.areaTotal} m². ${um(['Agende sua visita!', 'Aceita financiamento.', 'Pronto para morar.', 'Oportunidade única na região.'])}`,
        });
      }
    }

    // ----- Notificações (régua de comunicação) -----
    const notificacoesBase = [
      ['Boas-vindas ao Cliente', 'Novo Cliente Cadastrado', ['WhatsApp', 'E-mail'], 'Cliente', 'Bem-vindo à Urbânia', 'Olá, {NomeCliente}! Seja bem-vindo à Urbânia Imóveis. Estamos prontos para encontrar o imóvel ideal para você!'],
      ['Confirmação de Visita', 'Visita Agendada', ['WhatsApp', 'SMS'], 'Cliente', 'Visita agendada', 'Olá {NomeCliente}, sua visita ao imóvel {Imovel} está marcada para {Data} às {Hora} com o corretor {Corretor}.'],
      ['Visita confirmada ao corretor', 'Visita Confirmada', ['WhatsApp'], 'Corretor', 'Visita confirmada', '{Corretor}, o cliente {NomeCliente} confirmou a visita em {Endereco} no dia {Data} às {Hora}.'],
      ['Aviso de Nova Proposta', 'Proposta/Negociação Recebida', ['E-mail', 'WhatsApp'], 'Proprietário', 'Nova proposta recebida', 'Prezado(a) {NomeProprietario}, recebemos uma proposta de {Valor} para o imóvel {Imovel}.'],
      ['Proposta aceita', 'Proposta Aceita', ['WhatsApp', 'E-mail'], 'Todos', 'Proposta aceita!', 'A proposta de {Valor} para o imóvel {Imovel} foi aceita. Parabéns, {NomeCliente}!'],
      ['Contrato assinado', 'Contrato Assinado', ['E-mail'], 'Todos', 'Contrato assinado', 'O contrato do imóvel {Imovel} foi assinado em {Data}. Guarde este e-mail para consulta.'],
      ['Lembrete de Vencimento de Aluguel', 'Vencimento de Aluguel (3 dias antes)', ['WhatsApp', 'E-mail'], 'Cliente', 'Lembrete de aluguel', 'Olá {NomeCliente}, o aluguel do imóvel {Imovel} vence em {Data}, no valor de {Valor}.'],
      ['Cobrança de aluguel em atraso', 'Aluguel em Atraso', ['WhatsApp', 'SMS', 'E-mail'], 'Cliente', 'Aluguel em atraso', '{NomeCliente}, identificamos que o aluguel de {Valor} venceu em {Data}. Regularize para evitar multa.'],
      ['Aviso de Repasse ao Proprietário', 'Repasse Realizado ao Proprietário', ['WhatsApp', 'E-mail'], 'Proprietário', 'Repasse realizado', 'Olá {NomeProprietario}, confirmamos o repasse de {Valor} do imóvel {Imovel} via PIX {ChavePix}.'],
      ['Orçamento de reparo', 'Orçamento de Reparo Solicitado', ['E-mail'], 'Proprietário', 'Orçamento de reparo', '{NomeProprietario}, foi solicitado um orçamento de reparo para o imóvel {Imovel}. Valor estimado: {Valor}.'],
    ];
    for (const [i, [nome, gatilho, canaisN, destinatario, titulo, mensagem]] of notificacoesBase.entries()) {
      await inserir('notificacoes', {
        nome, gatilho, canais: JSON.stringify(canaisN), canal: canaisN[0], destinatario, titulo, mensagem,
        status: i % 4 === 3 ? 'Inativo' : 'Ativo', dataCriacao: dia(-entre(20, 200)), dataEnvio: chance(0.6) ? dia(-entre(0, 10)) : null,
      });
    }

    // Mapeamento de IP consistente por usuário iniciando em 192.168.1.1
    const ipsPorUsuario = {};
    let proximoIpNum = 1;
    funcionarios.forEach(f => {
      const nomeLower = (f.nome || '').toLowerCase();
      if (nomeLower.includes('admin') || nomeLower.includes('diretoria')) {
        ipsPorUsuario[f.id] = '192.168.1.1';
      } else {
        proximoIpNum += 1;
        ipsPorUsuario[f.id] = `192.168.1.${proximoIpNum}`;
      }
    });

    // ----- Auditoria (histórico de alterações do sistema) -----
    const modulosAuditoria = ['clientes', 'imoveis', 'visitas', 'negociacoes', 'contratos', 'financeiro', 'despesas', 'multas', 'reparos', 'anuncios', 'proprietarios'];
    const eventos = [];
    for (let i = 0; i < 60; i++) {
      const f = um(funcionarios.filter(x => x.status === 'Ativo'));
      const offset = -entre(0, 30);
      const acao = um(['Criação', 'Criação', 'Alteração', 'Alteração', 'Alteração', 'Exclusão']);
      const entidade = um(modulosAuditoria);
      const nomeLimpo = (f.nome || '').replace(/\s*\((?:Admin|Administrador)\)\s*/gi, '').trim();
      const primeiroNome = f.nome.trim().split(/\s+/)[0];
      const comp = (f.nome.toLowerCase().includes('admin') || f.nome.toLowerCase().includes('diretoria') || f.nome.toLowerCase().includes('gm'))
        ? 'Pc-GM'
        : `Pc-${primeiroNome}`;
      eventos.push({
        usuario: `${nomeLimpo} (${f.cargo})`,
        computador: comp,
        acao,
        entidade,
        entidadeId: entre(1, 30),
        detalhes: `Registro ${{ Criação: 'cadastrado', Alteração: 'atualizado', Exclusão: 'excluído' }[acao]} no módulo ${entidade}`,
        data: dia(offset),
        hora: `${hora()}:${String(entre(0, 59)).padStart(2, '0')}:${String(entre(10, 59)).padStart(2, '0')}`,
        ip: ipsPorUsuario[f.id] || '192.168.1.1',
      });
    }
    eventos.sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
    for (const e of eventos) await inserir('auditoria', e);

    await run('COMMIT');
  } catch (err) {
    await run('ROLLBACK').catch(() => {});
    throw err;
  }

  // Perfil e usuário Visitante (somente leitura)
  await garantirAcessosPadrao();
};
