require('dotenv').config();

module.exports = {
  // Nome do clube (personalize no .env)
  nomeClube: process.env.NOME_CLUBE || 'Clube de Tiro',
  // Número para onde encaminhar quando precisar de atendimento humano (com DDI, sem +)
  numeroAtendimentoHumano: process.env.NUMERO_ATENDIMENTO_HUMANO || '',
  // Palavras que indicam que o usuário quer falar com humano
  palavrasEscalarHumano: ['humano', 'atendente', 'pessoa', 'operador', 'falar com alguém', 'não entendi', 'ajuda humana', 'atendimento humano'],
  // Mensagem quando não entender
  mensagemPadraoNaoEntendi: 'Desculpe, não consegui entender. Você pode digitar *MENU* para ver as opções ou *ATENDENTE* para falar com um atendente.',
  // Fuso horário para verificar horário de atendimento (ex: America/Sao_Paulo)
  timezone: process.env.TZ || 'America/Sao_Paulo',
  // Mensagem quando estiver fora do horário de atendimento
  mensagemForaHorario: process.env.MENSAGEM_FORA_HORARIO || 'No momento estamos fora do horário de atendimento. Assim que estivermos disponíveis, entraremos em contato. Obrigado!',
  // PIX: CNPJ para filiação/renovação
  pixCnpj: process.env.PIX_CNPJ || '31.161.416/0001-15',
  // Pagamento por link (Infinity Pay): true = envia link de PIX/cartão; false = envia apenas instruções para contato
  usarPagamentoPorLink: process.env.USAR_PAGAMENTO_LINK !== 'false' && process.env.USAR_PAGAMENTO_LINK !== '0',
  // Nomes das provas (menu Provas) – personalize no .env
  provas: {
    internas: process.env.NOME_PROVA_INTERNAS || 'Provas internas',
    calibre: process.env.NOME_PROVA_CALIBRE || 'Calibre',
    cbtt: process.env.NOME_PROVA_CBTT || 'CBTT',
    w2c: process.env.NOME_PROVA_W2C || 'W2C',
    linade: process.env.NOME_PROVA_LINADE || 'Linade',
    federacaoPaulista: process.env.NOME_PROVA_FEDERACAO_PAULISTA || 'Federação Paulista de Tiro Esportivo',
  },
};
