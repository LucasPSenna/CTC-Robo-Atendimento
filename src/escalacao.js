/**
 * Lógica de escalação para atendimento humano.
 * Só encaminha quando o usuário pede explicitamente ou após várias tentativas sem sucesso.
 */

const config = require('./config');
const { RESPOSTAS } = require('./conteudo');

// Contador de "não entendi" por chat (em produção use Redis ou DB)
const contadorNaoEntendi = new Map();

const MAX_NAO_ENTENDIDO_PARA_ESCALAR = 2;

/**
 * Verifica se a mensagem indica pedido de atendimento humano
 */
function pediuAtendimentoHumano(texto) {
  if (!texto || typeof texto !== 'string') return false;
  const t = texto.toLowerCase().trim();
  return config.palavrasEscalarHumano.some(palavra => t.includes(palavra.toLowerCase()));
}

/**
 * Registra que o bot não entendeu e retorna se já deve escalar
 */
function registrarNaoEntendi(chatId) {
  const atual = (contadorNaoEntendi.get(chatId) || 0) + 1;
  contadorNaoEntendi.set(chatId, atual);
  return atual >= MAX_NAO_ENTENDIDO_PARA_ESCALAR;
}

function zerarContadorNaoEntendi(chatId) {
  contadorNaoEntendi.delete(chatId);
}

/**
 * Retorna a mensagem de escalação e se deve notificar alguém
 */
function obterMensagemEscalacao(chatId) {
  zerarContadorNaoEntendi(chatId);
  return RESPOSTAS.atendente;
}

/**
 * Número para notificar quando escalar (opcional: enviar aviso para equipe)
 */
function getNumeroAtendimentoHumano() {
  return config.numeroAtendimentoHumano;
}

module.exports = {
  pediuAtendimentoHumano,
  registrarNaoEntendi,
  zerarContadorNaoEntendi,
  obterMensagemEscalacao,
  getNumeroAtendimentoHumano,
  MAX_NAO_ENTENDIDO_PARA_ESCALAR,
};
