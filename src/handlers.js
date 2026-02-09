/**
 * Tratamento de mensagens recebidas - responde com o menu e as opções do clube.
 */

const { MENU_PRINCIPAL, RESPOSTAS, PALAVRAS_CHAVE, OPCOES_SELECAO_IDS } = require('./conteudo');
const config = require('./config');
const {
  pediuAtendimentoHumano,
  registrarNaoEntendi,
  zerarContadorNaoEntendi,
  obterMensagemEscalacao,
  getNumeroAtendimentoHumano,
} = require('./escalacao');

/**
 * Normaliza texto: minúsculo, sem acentos extras, trim
 */
function normalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/**
 * Tenta resolver opção por número (1-7)
 */
function opcaoPorNumero(texto) {
  const n = texto.trim();
  const map = {
    '1': 'horarios',
    '2': 'precos',
    '3': 'agendar',
    '4': 'documentos',
    '5': 'regras',
    '6': 'localizacao',
    '7': 'solicitacao_documentos',
    '8': 'atendente',
  };
  return map[n] || null;
}

/**
 * Encontra a chave de resposta por palavra-chave ou número
 */
function encontrarResposta(texto) {
  const norm = normalizar(texto);
  if (!norm) return null;

  // Seleção por lista/botão (ID retornado pelo WhatsApp)
  if (OPCOES_SELECAO_IDS.includes(norm)) return norm;

  const porNumero = opcaoPorNumero(texto);
  if (porNumero) return porNumero;

  // Uma palavra exata
  if (PALAVRAS_CHAVE[norm]) return PALAVRAS_CHAVE[norm];

  // Palavras contidas no texto
  for (const [palavra, chave] of Object.entries(PALAVRAS_CHAVE)) {
    if (norm.includes(palavra)) return chave;
  }

  return null;
}

/**
 * Confirmação genérica para mensagens que parecem agendamento (ex: "agendar 15/02 14h")
 */
function respostaAgendamentoRecebido(texto) {
  const norm = normalizar(texto);
  if (!norm.startsWith('agendar')) return null;
  const resto = texto.trim().slice(7).trim();
  if (!resto) return null;
  return `📅 *Solicitação de agendamento recebida*\n\nAnotamos: ${resto}\n\nEm breve entraremos em contato para confirmar. Se preferir, digite *CONTATO* para falar com um atendente agora.`;
}

/**
 * Gera a resposta para enviar ao usuário
 * @returns { { texto: string, escalarParaHumano?: boolean } }
 */
function processarMensagem(texto, chatId) {
  const agendamento = respostaAgendamentoRecebido(texto);
  if (agendamento) {
    zerarContadorNaoEntendi(chatId);
    return { texto: agendamento, escalarParaHumano: true };
  }

  if (pediuAtendimentoHumano(texto)) {
    return {
      texto: obterMensagemEscalacao(chatId),
      escalarParaHumano: true,
    };
  }

  const chave = encontrarResposta(texto);
  if (chave) {
    zerarContadorNaoEntendi(chatId);
    if (chave === 'menu') {
      return { texto: MENU_PRINCIPAL };
    }
    if (chave === 'atendente') {
      return {
        texto: RESPOSTAS.atendente,
        escalarParaHumano: true,
      };
    }
    return { texto: RESPOSTAS[chave] || MENU_PRINCIPAL };
  }

  // Não entendeu
  const deveEscalar = registrarNaoEntendi(chatId);
  if (deveEscalar) {
    return {
      texto: `${config.mensagemPadraoNaoEntendi}\n\nComo não conseguimos ajudar automaticamente, um atendente será acionado. ${RESPOSTAS.atendente}`,
      escalarParaHumano: true,
    };
  }

  return {
    texto: config.mensagemPadraoNaoEntendi,
  };
}

module.exports = {
  processarMensagem,
  getNumeroAtendimentoHumano,
};
