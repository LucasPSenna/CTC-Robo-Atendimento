/**
 * Geração de links de pagamento via API Infinity Pay.
 * Handle: ctc-clube-de-tiro-de-469 (usuário $ctc-clube-de-tiro-de-469)
 * API: POST https://api.infinitepay.io/invoices/public/checkout/links
 */

const config = require('./config');

const INFINITYPAY_HANDLE = (process.env.INFINITYPAY_HANDLE || 'ctc-clube-de-tiro-de-469').replace(/^\$/, '');
const API_URL = 'https://api.infinitepay.io/invoices/public/checkout/links';

const VALORES = {
  renovacao: 65000,   // R$ 650,00 em centavos
  filiacao: 75000,    // R$ 750,00 em centavos
};

/** Descrições como serviço (não produto) - CTC Clube de Tiro */
const DESCRICOES = {
  renovacao: 'Serviço - Renovação de filiação - CTC Clube de Tiro',
  filiacao: 'Serviço - Filiação - CTC Clube de Tiro',
};

/** Limite de parcelas no cartão: 4x sem juros. A Infinity Pay libera 12x com juros por padrão; enviamos 4 para tentar limitar. Se o link ainda mostrar 12x, configure "até 4x sem juros" no app Infinity Pay (Checkout / Link de pagamento). */
const MAX_PARCELAS = 4;

/**
 * Gera um link de pagamento na Infinity Pay.
 * Objetivo: até 4x sem juros (a API pode ignorar; nesse caso configure no app Infinity Pay).
 * @param {'renovacao'|'filiacao'} tipo
 * @returns {Promise<string>} URL do checkout
 */
async function gerarLink(tipo) {
  const price = VALORES[tipo];
  const description = DESCRICOES[tipo];
  if (!price || !description) throw new Error('Tipo inválido: use renovacao ou filiacao');

  const orderNsu = `ctc-${tipo}-${Date.now()}`;
  const body = {
    handle: INFINITYPAY_HANDLE,
    order_nsu: orderNsu,
    max_installments: MAX_PARCELAS,
    installments: MAX_PARCELAS,
    items: [
      { quantity: 1, price, description },
    ],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Infinity Pay API: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  if (!data.url) throw new Error('Resposta da Infinity Pay sem URL');
  return data.url;
}

const ROTULOS = {
  renovacao: { titulo: 'Renovação', valor: 'R$ 650,00' },
  filiacao: { titulo: 'Filiação', valor: 'R$ 750,00' },
};

/** Link do formulário de pré-filiação (CTC) */
const LINK_PRE_FILIACAO = 'https://www.clubedetirodecruzeiro.com.br/pre-filiacao.html';

const AVISO_COMPROVANTE = `
📌 *Após o pagamento*, envie o comprovante aqui pelo WhatsApp para concluirmos o processo.
`.trim();

/**
 * Monta a mensagem para uma única opção (renovação ou filiação): PIX + link do cartão (até 4x sem juros).
 * Filiação inclui link da pré-filiação. Ambas incluem aviso para enviar comprovante.
 * @param {'renovacao'|'filiacao'} tipo
 * @returns {Promise<string>}
 */
async function getMensagemPagamento(tipo) {
  const pixCnpj = config.pixCnpj || '31.161.416/0001-15';
  const { titulo, valor } = ROTULOS[tipo] || { titulo: tipo, valor: '' };

  let bloco = `💳 *${titulo}* (${valor})
`;

  if (tipo === 'filiacao') {
    bloco += `
*Pré-filiação* – Preencha o formulário antes de pagar:
${LINK_PRE_FILIACAO}
`;
  }

  bloco += `
*PIX* (chave CNPJ)
\`${pixCnpj}\`

*Cartão de crédito* (até ${MAX_PARCELAS}x sem juros via Infinity Pay)
`;

  try {
    const link = await gerarLink(tipo);
    bloco += `
*Link para pagamento:* ${link}
`;
  } catch (e) {
    console.error('Erro ao gerar link Infinity Pay:', e.message);
    bloco += `
_Para receber o link de pagamento no cartão, digite *CONTATO* ou *10*._
`;
  }

  bloco += `

${AVISO_COMPROVANTE}
`;

  return bloco.trim();
}

module.exports = {
  gerarLink,
  getMensagemPagamento,
  INFINITYPAY_HANDLE,
};
