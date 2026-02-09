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
};
