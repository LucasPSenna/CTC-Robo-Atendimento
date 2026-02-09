/**
 * Robô assistente WhatsApp - Clube de Tiro
 * Atendimento automatizado; escalação para humano apenas em último caso.
 */

const path = require('path');

// No Render, o cache do Puppeteer precisa ficar DENTRO do projeto para ir no deploy.
// Configure no Render: PUPPETEER_CACHE_DIR=./cache/puppeteer
if (process.env.RENDER && !process.env.PUPPETEER_CACHE_DIR) {
  process.env.PUPPETEER_CACHE_DIR = path.join(process.cwd(), 'cache', 'puppeteer');
}

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { processarMensagem, getNumeroAtendimentoHumano } = require('./handlers');

// Chrome/Chromium: prioridade para variável de ambiente (ex.: Docker); senão usa o do Puppeteer
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

/** Log de mensagem enviada: destinatário e prévia do conteúdo */
function logEnvio(destinatario, conteudo, tipo = 'resposta') {
  const texto = typeof conteudo === 'string' ? conteudo : '[mídia]';
  const preview = texto.replace(/\n/g, ' ').slice(0, 60);
  const quando = new Date().toISOString();
  console.log(`[${quando}] ENVIADO (${tipo}) para ${destinatario}: "${preview}${texto.length > 60 ? '...' : ''}"`);
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

  // Ignora apenas mídia sem legenda (opcional: pode tratar áudio depois)
  const texto = typeof body === 'string' ? body.trim() : '';
  if (!texto && !msg.hasMedia) {
    const { processarMensagem: processar } = require('./handlers');
    const { texto: resp } = processar('menu', chatId);
    await msg.reply(resp);
    logEnvio(from, resp, 'menu');
    return;
  }

  try {
    const { texto: resposta, escalarParaHumano } = processarMensagem(texto, chatId);
    await msg.reply(resposta);
    logEnvio(from, resposta, 'resposta');

    if (escalarParaHumano && getNumeroAtendimentoHumano()) {
      const numero = getNumeroAtendimentoHumano().replace(/\D/g, '');
      const destino = numero.includes('@c.us') ? numero : `${numero}@c.us`;
      const msgEscalacao = `🔔 *Escalação para atendimento humano*\n\nContato: ${from}\nÚltima mensagem: "${texto.substring(0, 200)}"\n\nVerifique o WhatsApp para atender.`;
      try {
        await client.sendMessage(destino, msgEscalacao);
        logEnvio(destino, msgEscalacao, 'escalação');
      } catch (e) {
        console.error('Erro ao notificar atendente:', e.message);
      }
    }
  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
    try {
      const msgErro = 'Desculpe, ocorreu um erro. Por favor, tente novamente em instantes ou digite MENU para ver as opções.';
      await msg.reply(msgErro);
      logEnvio(from, msgErro, 'erro');
    } catch (_) {}
  }
});

client.initialize().catch((err) => {
  console.error('Falha ao iniciar cliente:', err);
  process.exit(1);
});
