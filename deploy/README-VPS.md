# Uso em VPS Linux

Passo a passo para rodar o robô em um servidor Linux (Ubuntu/Debian ou similar).

## 1. Dependências no servidor

```bash
# Node.js 18+ (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Chromium (para o WhatsApp Web)
sudo apt-get update
sudo apt-get install -y chromium-browser
# Ou, em algumas distros:
# sudo apt-get install -y chromium
```

Se o executável do Chromium for outro (ex.: `/usr/bin/chromium`), o código detecta automaticamente. Você também pode definir no `.env`:

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 2. Clonar e configurar o projeto

```bash
cd ~
git clone https://github.com/LucasPSenna/CTC-Robo-Atendimento.git
cd CTC-Robo-Atendimento

npm install
cp .env.example .env
nano .env   # edite NOME_CLUBE e NUMERO_ATENDIMENTO_HUMANO
```

## 3. Primeira execução (escanear QR Code)

Rode uma vez no terminal para aparecer o QR Code e vincular o WhatsApp:

```bash
npm start
```

Escaneie o QR Code com o celular (WhatsApp → Aparelhos conectados). Depois que conectar, pare com `Ctrl+C`. A sessão fica salva em `.wwebjs_auth`.

## 4. Rodar em segundo plano

### Opção A: PM2 (recomendado)

```bash
sudo npm install -g pm2
pm2 start src/index.js --name ctc-robo
pm2 save
pm2 startup   # segue as instruções para iniciar no boot
```

Comandos úteis: `pm2 logs ctc-robo`, `pm2 restart ctc-robo`, `pm2 stop ctc-robo`.

### Opção B: systemd

```bash
sudo cp deploy/ctc-robo-whats.service /etc/systemd/system/
sudo nano /etc/systemd/system/ctc-robo-whats.service
# Ajuste User= e WorkingDirectory= para seu usuário e caminho do projeto

sudo systemctl daemon-reload
sudo systemctl enable ctc-robo-whats
sudo systemctl start ctc-robo-whats
sudo systemctl status ctc-robo-whats
```

Ver logs em tempo real:

```bash
journalctl -u ctc-robo-whats -f
```

## 5. Atualizar o projeto

```bash
cd ~/CTC-Robo-Atendimento
git pull
npm install
pm2 restart ctc-robo
# ou: sudo systemctl restart ctc-robo-whats
```

## Firewall

O robô não abre porta HTTP; só faz conexão de saída (WhatsApp). Não é necessário liberar porta no firewall para o bot.
