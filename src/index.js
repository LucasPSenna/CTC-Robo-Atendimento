/**
 * Robô assistente WhatsApp - Clube de Tiro
 * Atendimento automatizado; escalação para humano apenas em último caso.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { processarMensagem, getNumeroAtendimentoHumano } = require('./handlers');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

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
    return;
  }

  try {
    const { texto: resposta, escalarParaHumano } = processarMensagem(texto, chatId);
    await msg.reply(resposta);

    if (escalarParaHumano && getNumeroAtendimentoHumano()) {
      const numero = getNumeroAtendimentoHumano().replace(/\D/g, '');
      const destino = numero.includes('@c.us') ? numero : `${numero}@c.us`;
      try {
        await client.sendMessage(
          destino,
          `🔔 *Escalação para atendimento humano*\n\nContato: ${from}\nÚltima mensagem: "${texto.substring(0, 200)}"\n\nVerifique o WhatsApp para atender.`
        );
      } catch (e) {
        console.error('Erro ao notificar atendente:', e.message);
      }
    }
  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
    try {
      await msg.reply(
        'Desculpe, ocorreu um erro. Por favor, tente novamente em instantes ou digite MENU para ver as opções.'
      );
    } catch (_) {}
  }
});

client.initialize().catch((err) => {
  console.error('Falha ao iniciar cliente:', err);
  process.exit(1);
});
