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
const { getMensagemPagamento } = require('./infinitepay');
const config = require('./config');

// Chrome/Chromium: 1) PUPPETEER_EXECUTABLE_PATH (Docker/VPS) 2) Chromium do sistema (VPS) 3) Puppeteer (Render)
// Não usar userDataDir: LocalAuth gerencia o próprio perfil.
// headless: 'new' evita TargetCloseError no Windows; USE_HEADLESS=false abre a janela (útil para debug).
const puppeteerConfig = {
  headless: process.env.USE_HEADLESS === 'false' ? false : 'new',
  timeout: 60000,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-features=TranslateUI',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-features=IsolateOrigins,site-per-process',
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
} else if (process.platform === 'win32') {
  // No Windows, puppeteer-core (usado pelo whatsapp-web.js) não traz Chrome; usar Chromium do pacote puppeteer ou Chrome instalado.
  const winChromePaths = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
  const foundChrome = winChromePaths.find((p) => { try { return fs.existsSync(p); } catch (_) { return false; } });
  if (foundChrome) {
    puppeteerConfig.executablePath = foundChrome;
  } else {
    try {
      const puppeteer = require('puppeteer');
      puppeteerConfig.executablePath = puppeteer.executablePath();
    } catch (e) {
      console.warn('Puppeteer não encontrado. Instale o Google Chrome ou o pacote puppeteer (npm install puppeteer).');
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

// No Windows: o puppeteer-core do whatsapp-web.js pode causar TargetCloseError. Lançamos o Chrome
// com o Puppeteer do projeto e passamos o endpoint para o Client conectar (feito em startClient).
let launchedBrowser = null;
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

/** Envia o menu em texto sempre para o mesmo chat que enviou a mensagem (objeto Chat). */
async function enviarMenu(chat, numeroParaLogDestino) {
  await chat.sendMessage(MENU_PRINCIPAL);
  logEnvio(numeroParaLogDestino || chat.id._serialized, MENU_PRINCIPAL, 'menu');
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
  // Ignora mensagens enviadas pelo próprio bot
  if (msg.fromMe) return;

  // Ignora status/estado (histórias) — o evento "message" dispara para isso e não é chat direto
  if (msg.isStatus) return;

  const chat = await msg.getChat();
  const from = msg.from;
  const body = msg.body || '';
  const isGroup = chat.isGroup;
  const chatId = chat.id._serialized;

  // Só responde em chats privados 1:1 (não grupo, não status/broadcast)
  // chatId pode ser 5524998327329@c.us ou, em alguns casos, número@lid — ambos são chat direto
  const ehStatusOuBroadcast = /status|broadcast/i.test(chatId) || chatId.endsWith('@g.us');
  if (isGroup || ehStatusOuBroadcast) {
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
    await enviarMenu(chat, numeroLog);
    return;
  }

  try {
    const { texto: resposta, escalarParaHumano, chave } = processarMensagem(textoStr, chatId);

    // Só aplica horário de atendimento quando a opção precisa de atendimento humano
    if (escalarParaHumano && !estaEmHorarioAtendimento()) {
      await msg.reply(config.mensagemForaHorario);
      logEnvio(numeroLog, config.mensagemForaHorario, 'fora do horário');
      return;
    }

    let mensagemEnviar = resposta;
    if ((chave === 'renovacao' || chave === 'filiacao') && config.usarPagamentoPorLink) {
      mensagemEnviar = await getMensagemPagamento(chave);
    }

    if (mensagemEnviar === MENU_PRINCIPAL) {
      await enviarMenu(chat, numeroLog);
    } else {
      await msg.reply(mensagemEnviar);
      logEnvio(numeroLog, mensagemEnviar, 'resposta');
    }

    // Notificação de escalação: só para o número configurado (atendente), nunca para o contato que escreveu
    if (escalarParaHumano && getNumeroAtendimentoHumano()) {
      const numeroAtendente = getNumeroAtendimentoHumano().replace(/\D/g, '');
      const destinoAtendente = numeroAtendente.includes('@c.us') ? numeroAtendente : `${numeroAtendente}@c.us`;
      const msgEscalacao = `🔔 *Escalação para atendimento humano*\n\nContato: ${from}\nÚltima mensagem: "${texto.substring(0, 200)}"\n\nVerifique o WhatsApp para atender.`;
      try {
        await client.sendMessage(destinoAtendente, msgEscalacao);
        logEnvio(numeroAtendente, msgEscalacao, 'escalação');
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

/** No Windows, lança o Chrome com o Puppeteer do projeto e conecta o Client ao endpoint para evitar TargetCloseError. */
async function startClient() {
  if (process.platform === 'win32' && process.env.PUPPETEER_SKIP_EXTERNAL !== '1') {
    try {
      const puppeteer = require('puppeteer');
      let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      try {
        const wwebPath = path.join(require.resolve('whatsapp-web.js'), '..', 'src', 'util', 'Constants.js');
        userAgent = require(wwebPath).DefaultOptions.userAgent;
      } catch (_) {}
      const browserArgs = [
        ...puppeteerConfig.args,
        '--disable-blink-features=AutomationControlled',
        `--user-agent=${userAgent}`,
      ];
      launchedBrowser = await puppeteer.launch({
        headless: puppeteerConfig.headless,
        timeout: puppeteerConfig.timeout || 60000,
        executablePath: puppeteerConfig.executablePath || puppeteer.executablePath(),
        args: browserArgs,
      });
      client.options.puppeteer = { browserWSEndpoint: launchedBrowser.wsEndpoint() };
    } catch (e) {
      console.warn('Chrome externo não usado:', e.message, '- tentando modo padrão.');
      if (launchedBrowser) try { await launchedBrowser.close(); } catch (_) {}
      launchedBrowser = null;
    }
  }
  process.on('exit', () => { if (launchedBrowser) try { launchedBrowser.close(); } catch (_) {} });
  process.on('SIGINT', () => { if (launchedBrowser) try { launchedBrowser.close(); } catch (_) {} });
  await client.initialize();
}

startClient().catch((err) => {
  console.error('Falha ao iniciar cliente:', err);
  if (launchedBrowser) launchedBrowser.close().catch(() => {});
  process.exit(1);
});
