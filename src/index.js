/**
 * Robô assistente WhatsApp - Clube de Tiro
 * Atendimento automatizado; escalação para humano apenas em último caso.
 */

const path = require('path');
const fs = require('fs');

// No Render, o cache do Puppeteer precisa ficar DENTRO do projeto para ir no deploy.
// Configure no Render: PUPPETEER_CACHE_DIR=./cache/puppeteer
if (process.env.RENDER && !process.env.PUPPETEER_CACHE_DIR) {
  process.env.PUPPETEER_CACHE_DIR = path.join(process.cwd(), 'cache', 'puppeteer');
}

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { processarMensagem, getNumeroAtendimentoHumano } = require('./handlers');
const { MENU_PRINCIPAL } = require('./conteudo');
const { estaEmHorarioAtendimento } = require('./horarioAtendimento');
const config = require('./config');

// Chrome/Chromium: 1) PUPPETEER_EXECUTABLE_PATH (Docker/VPS) 2) Chromium do sistema (VPS) 3) Puppeteer (Render)
const puppeteerConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
};
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
} else if (process.platform === 'linux') {
  const paths = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome-stable'];
  const found = paths.find((p) => { try { return fs.existsSync(p); } catch (_) { return false; } });
  if (found) puppeteerConfig.executablePath = found;
  else if (process.env.RENDER) {
    try {
      const puppeteer = require('puppeteer');
      puppeteerConfig.executablePath = puppeteer.executablePath();
    } catch (e) {
      console.warn('Puppeteer não encontrado; usando Chrome padrão do sistema.');
    }
  }
} else if (process.env.RENDER) {
  try {
    const puppeteer = require('puppeteer');
    puppeteerConfig.executablePath = puppeteer.executablePath();
  } catch (e) {
    console.warn('Puppeteer não encontrado; usando Chrome padrão do sistema.');
  }
}

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: puppeteerConfig,
});

/** Extrai número real para log (evita mostrar @c.us, @lid, etc.) */
function numeroParaLog(contactOuId) {
  if (!contactOuId) return '?';
  if (typeof contactOuId === 'object' && contactOuId !== null) {
    const n = contactOuId.number || (contactOuId.id && contactOuId.id.user);
    if (n) return n;
    const s = contactOuId.id && contactOuId.id._serialized;
    if (s) return s.replace(/@.*$/, '');
  }
  const s = String(contactOuId);
  return s.replace(/@.*$/, '') || s;
}

/** Log de mensagem enviada: destinatário (número real) e prévia do conteúdo */
function logEnvio(destinatario, conteudo, tipo = 'resposta') {
  const num = typeof destinatario === 'object' ? numeroParaLog(destinatario) : (typeof destinatario === 'string' && destinatario.includes('@') ? destinatario.replace(/@.*$/, '') : String(destinatario || '?'));
  const texto = typeof conteudo === 'string' ? conteudo : '[mídia]';
  const preview = texto.replace(/\n/g, ' ').slice(0, 60);
  const quando = new Date().toISOString();
  console.log(`[${quando}] ENVIADO (${tipo}) para ${num}: "${preview}${texto.length > 60 ? '...' : ''}"`);
}

/** Envia o menu em texto. (Lista interativa não é suportada: [LT01] Whatsapp business can't send this yet) */
async function enviarMenu(chatId, numeroParaLogDestino) {
  await client.sendMessage(chatId, MENU_PRINCIPAL);
  logEnvio(numeroParaLogDestino || chatId, MENU_PRINCIPAL, 'menu');
}

client.on('qr', (qr) => {
  console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp (Dispositivos conectados):\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\n✅ Cliente WhatsApp conectado. Robô do clube de tiro ativo.\n');
});

client.on('authenticated', () => {
  console.log('🔐 Sessão autenticada.');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação:', msg);
});

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  const from = msg.from;
  const body = msg.body || '';
  const isGroup = chat.isGroup;
  const chatId = chat.id._serialized;

  // Só responde em chats privados (evita responder em grupos se não quiser)
  if (isGroup) {
    return;
  }

  // Ignora mensagens enviadas pelo próprio bot
  if (msg.fromMe) {
    return;
  }

  // Número real do contato para os logs (evita 110178829627629@lid etc.)
  let contact = null;
  try {
    contact = await chat.getContact();
  } catch (_) {}
  const numeroLog = contact ? numeroParaLog(contact) : numeroParaLog(from);

  // Texto da mensagem: prioridade para seleção (lista/botão), depois corpo da mensagem
  const texto = (msg.selectedRowId || msg.selectedButtonId || body || '').trim();
  const textoStr = typeof texto === 'string' ? texto : '';

  if (!textoStr && !msg.hasMedia) {
    await enviarMenu(chatId, numeroLog);
    return;
  }

  try {
    const { texto: resposta, escalarParaHumano } = processarMensagem(textoStr, chatId);

    // Só aplica horário de atendimento quando a opção precisa de atendimento humano
    if (escalarParaHumano && !estaEmHorarioAtendimento()) {
      await msg.reply(config.mensagemForaHorario);
      logEnvio(numeroLog, config.mensagemForaHorario, 'fora do horário');
      return;
    }

    if (resposta === MENU_PRINCIPAL) {
      await enviarMenu(chatId, numeroLog);
    } else {
      await msg.reply(resposta);
      logEnvio(numeroLog, resposta, 'resposta');
    }

    if (escalarParaHumano && getNumeroAtendimentoHumano()) {
      const numero = getNumeroAtendimentoHumano().replace(/\D/g, '');
      const destino = numero.includes('@c.us') ? numero : `${numero}@c.us`;
      const msgEscalacao = `🔔 *Escalação para atendimento humano*\n\nContato: ${from}\nÚltima mensagem: "${texto.substring(0, 200)}"\n\nVerifique o WhatsApp para atender.`;
      try {
        await client.sendMessage(destino, msgEscalacao);
        logEnvio(numero, msgEscalacao, 'escalação');
      } catch (e) {
        console.error('Erro ao notificar atendente:', e.message);
      }
    }
  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
    try {
      const msgErro = 'Desculpe, ocorreu um erro. Por favor, tente novamente em instantes ou digite MENU para ver as opções.';
      await msg.reply(msgErro);
      logEnvio(numeroLog, msgErro, 'erro');
    } catch (_) {}
  }
});

client.initialize().catch((err) => {
  console.error('Falha ao iniciar cliente:', err);
  process.exit(1);
});
