/**
 * Conteúdo do assistente - personalize com os dados reais do seu clube de tiro.
 * Todas as mensagens são em português para o atendimento.
 */

const { nomeClube, pixCnpj, provas: nomesProvas } = require('./config');

const MENU_PRINCIPAL = `
🎯 *${nomeClube}* - Assistente Virtual

Escolha uma opção digitando o *número* ou a *palavra*:

1️⃣ *HORÁRIOS* - Horário de funcionamento
2️⃣ *PREÇOS* - Valores e planos
3️⃣ *AGENDAR* - Agendar visita ou aula
4️⃣ *DOCUMENTOS* - Documentos necessários (CR, etc.)
5️⃣ *REGRAS* - Regras e normas do clube
6️⃣ *LOCALIZAÇÃO* - Endereço e como chegar
7️⃣ *SOLICITAÇÃO DE DOCUMENTOS* - Solicitar ou enviar documentos
8️⃣ *RENOVAÇÃO* - Pagar renovação (R$ 650 - PIX ou cartão)
9️⃣ *FILIAÇÃO* - Pagar filiação (R$ 750 - PIX ou cartão)
🔟 *CONTATO* - Falar com atendente humano
1️⃣1️⃣ *PROVAS* - Provas e competições

Digite *MENU* a qualquer momento para ver este menu novamente.

_Bot desenvolvido por Lucas Senna_
`.trim();

/** Opções para o menu em lista (seleção por toque). IDs devem bater com as chaves de RESPOSTAS. */
const MENU_LIST_OPCOES = {
  body: `Escolha uma opção abaixo para *${nomeClube}*:`,
  buttonText: '📋 Ver opções',
  title: `${nomeClube} - Assistente`,
  footer: 'Toque no botão e selecione uma opção.',
  sections: [
    {
      title: 'Atendimento',
      rows: [
        { id: 'horarios', title: '🕐 Horários', description: 'Horário de funcionamento' },
        { id: 'precos', title: '💰 Preços', description: 'Valores e planos' },
        { id: 'agendar', title: '📅 Agendar', description: 'Visita ou aula de tiro' },
        { id: 'documentos', title: '📋 Documentos', description: 'O que trazer (CR, etc.)' },
        { id: 'regras', title: '📜 Regras', description: 'Normas do clube' },
        { id: 'localizacao', title: '📍 Localização', description: 'Endereço e como chegar' },
        { id: 'solicitacao_documentos', title: '📄 Solicitação de documentos', description: 'Solicitar ou enviar documentos' },
        { id: 'renovacao', title: '🔄 Renovação', description: 'Pagar renovação R$ 650 (PIX ou cartão)' },
        { id: 'filiacao', title: '💳 Filiação', description: 'Pagar filiação R$ 750 (PIX ou cartão)' },
        { id: 'atendente', title: '👤 Falar com atendente', description: 'Atendimento humano' },
        { id: 'provas', title: '🏆 Provas', description: 'Provas e competições' },
      ],
    },
  ],
};

/** IDs válidos de seleção (lista/botão) para resposta direta */
const OPCOES_SELECAO_IDS = ['horarios', 'precos', 'agendar', 'documentos', 'regras', 'localizacao', 'solicitacao_documentos', 'renovacao', 'filiacao', 'atendente', 'provas'];

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

  solicitacao_documentos: `
📄 *Solicitação de documentos*

Para solicitar ou enviar documentos (renovação de CR, atestados, etc.):

1. Digite *CONTATO* ou *10* para falar com um atendente, que irá orientar o envio.
2. Ou compareça ao clube no horário de atendimento com os documentos em mãos.

_Guarde cópias dos documentos enviados para seu controle._
`.trim(),

  // Renovação e Filiação: com link ativo usa getMensagemPagamento (infinitepay.js); sem link usa o texto abaixo
  renovacao: `
🔄 *Renovação de filiação* – R$ 650,00

💳 *Chave PIX (CNPJ):*
\`${pixCnpj}\`

Realize o pagamento e *envie o comprovante neste chat* para confirmarmos sua renovação.
`.trim(),
  filiacao: `
💳 *Filiação* – R$ 750,00

💳 *Chave PIX (CNPJ):*
\`${pixCnpj}\`

Realize o pagamento e *envie o comprovante neste chat* para confirmarmos sua filiação.
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

  provas: (() => {
    const p = nomesProvas;
    return `
🏆 *Provas e competições*

• *${p.internas}*
• *${p.calibre}*
• *${p.cbtt}*
• *${p.w2c}*
• *${p.linade}*
• *${p.federacaoPaulista}*

Para datas, regulamentos ou inscrições, digite *CONTATO* ou *10* para falar com um atendente.
`.trim();
  })(),
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
  solicitacao: 'solicitacao_documentos',
  solicitacao_documentos: 'solicitacao_documentos',
  solicitar: 'solicitacao_documentos',
  'solicitar documentos': 'solicitacao_documentos',
  'enviar documentos': 'solicitacao_documentos',
  filiacao: 'filiacao',
  filiação: 'filiacao',
  renovar: 'renovacao',
  renovação: 'renovacao',
  renovacao: 'renovacao',
  'quero renovar': 'renovacao',
  'me filiar': 'filiacao',
  'quero me filiar': 'filiacao',
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
  provas: 'provas',
  prova: 'provas',
  competicao: 'provas',
  competições: 'provas',
  competicoes: 'provas',
  cbtt: 'provas',
  linade: 'provas',
  w2c: 'provas',
  calibre: 'provas',
};

module.exports = {
  MENU_PRINCIPAL,
  MENU_LIST_OPCOES,
  OPCOES_SELECAO_IDS,
  RESPOSTAS,
  PALAVRAS_CHAVE,
};
