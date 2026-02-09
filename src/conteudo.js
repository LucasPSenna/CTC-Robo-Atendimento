/**
 * Conteúdo do assistente - personalize com os dados reais do seu clube de tiro.
 * Todas as mensagens são em português para o atendimento.
 */

const { nomeClube } = require('./config');

const MENU_PRINCIPAL = `
🎯 *${nomeClube}* - Assistente Virtual

Escolha uma opção digitando o *número* ou a *palavra*:

1️⃣ *HORÁRIOS* - Horário de funcionamento
2️⃣ *PREÇOS* - Valores e planos
3️⃣ *AGENDAR* - Agendar visita ou aula
4️⃣ *DOCUMENTOS* - Documentos necessários (CR, etc.)
5️⃣ *REGRAS* - Regras e normas do clube
6️⃣ *LOCALIZAÇÃO* - Endereço e como chegar
7️⃣ *CONTATO* - Falar com atendente humano

Digite *MENU* a qualquer momento para ver este menu novamente.
`.trim();

const RESPOSTAS = {
  horarios: `
🕐 *Horários de funcionamento*

• *Segunda:* 18h às 22h
• Terça a Quinta: fechado
• *Sexta:* 10h às 22h
• *Sábado e Domingo:* 9h às 18h

_Consulte sempre antes de vir; horários podem variar em feriados._
`.trim(),

  precos: `
💰 *Valores e planos*

• Visita avulsa(Day Use): R$ 150,00
• Filiação: R$ 750,00
• Renovação de filiação: R$ 650,00
• Curso de Inicialização no Tiro: R$ 350,00
• Aluguel de armas: R$ XX,00

_Pagamento em dinheiro, PIX ou cartão._
`.trim(),

  agendar: `
📅 *Agendamento*

Para agendar visita ou aula de tiro:

1. Envie: *AGENDAR [data] [horário]*  
   Exemplo: _AGENDAR 15/02 14h_

2. Ou digite *CONTATO* para um atendente agendar por você.

*(Você pode integrar com Google Calendar ou planilha depois.)*
`.trim(),

  documentos: `
📋 *Documentos necessários*

Para frequentar o clube você precisa de:

• **Documento com foto** (RG ou CNH)
• **CR (Certificado de Registro)** – para portar/transitar com arma
• **Atestado de capacidade técnica** (quando aplicável)
• Menores: autorização e acompanhamento do responsável

_Na primeira visita traga RG e, se tiver, o CR._
`.trim(),

  regras: `
📜 *Regras e normas do clube*

• Respeitar sempre as ordens dos instrutores e da direção
• Uso obrigatório de EPI (óculos e protetor auricular)
• Proibido apontar arma para pessoas em qualquer situação
• Arma só deve ser carregada na linha de tiro, quando autorizado
• Celular e filmagens somente com autorização

_Desrespeito às normas pode resultar em exclusão._
`.trim(),

  localizacao: `
📍 *Localização*

Endereço: Rua Iguatemi Santos de Carvalho, 501 - Vila Juvenal - Cruzeiro - SP
CEP: 12702-332

Como chegar: https://maps.app.goo.gl/ikWp95yfAVZuGQfo6
`.trim(),

  atendente: `
👤 *Atendimento humano*

Você será atendido por um de nossos atendentes em breve.

Obrigado pelo contato!
`.trim(),
};

/**
 * Mapeia palavras-chave (minúsculas) para a chave em RESPOSTAS
 */
const PALAVRAS_CHAVE = {
  menu: 'menu',
  ajuda: 'menu',
  oi: 'menu',
  olá: 'menu',
  'bom dia': 'menu',
  'boa tarde': 'menu',
  'boa noite': 'menu',
  horario: 'horarios',
  horários: 'horarios',
  horarios: 'horarios',
  funcionamento: 'horarios',
  abre: 'horarios',
  fecha: 'horarios',
  preco: 'precos',
  preços: 'precos',
  precos: 'precos',
  valor: 'precos',
  valores: 'precos',
  preço: 'precos',
  mensalidade: 'precos',
  agendar: 'agendar',
  agendamento: 'agendar',
  visita: 'agendar',
  aula: 'agendar',
  documento: 'documentos',
  documentos: 'documentos',
  cr: 'documentos',
  certificado: 'documentos',
  regras: 'regras',
  normas: 'regras',
  localizacao: 'localizacao',
  localização: 'localizacao',
  endereco: 'localizacao',
  endereço: 'localizacao',
  'onde fica': 'localizacao',
  'como chego': 'localizacao',
  contato: 'atendente',
  atendente: 'atendente',
  humano: 'atendente',
  pessoa: 'atendente',
};

module.exports = {
  MENU_PRINCIPAL,
  RESPOSTAS,
  PALAVRAS_CHAVE,
};
