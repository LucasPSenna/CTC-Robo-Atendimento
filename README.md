# Robô Assistente WhatsApp - Clube de Tiro

Assistente automático para WhatsApp que faz o atendimento do clube de tiro por completo. Só encaminha para um atendente humano em último caso (quando o usuário pede ou quando não entender após algumas tentativas).

## O que o robô faz

- **Menu interativo**: horários, preços, agendamento, documentos, regras, localização.
- **Respostas por número (1–7)** ou por palavra-chave (ex: "horário", "preço", "documentos").
- **Agendamento**: o usuário pode enviar algo como `AGENDAR 15/02 14h`; o robô confirma e você pode avisar um atendente.
- **Escalação para humano**:
  - Quando o usuário pede (ex: "quero falar com alguém", "atendente", opção 7).
  - Quando o usuário não é entendido **2 vezes** seguidas — aí o robô informa que um atendente será acionado.
- **Notificação ao atendente**: se você configurar um número no `.env`, o robô envia uma mensagem para esse número sempre que houver escalação.

## Requisitos

- Node.js 18 ou superior
- Conta WhatsApp (celular com WhatsApp ativo para escanear o QR Code)

## Instalação

1. Clone ou copie este projeto e entre na pasta:

```bash
cd "Projeto Robo Whats"
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` a partir do exemplo:

```bash
copy .env.example .env
```

4. Edite o `.env` e preencha:

- `NOME_CLUBE`: nome do seu clube (aparece no menu).
- `NUMERO_ATENDIMENTO_HUMANO`: número com DDI+DDD+número (ex: `5511999999999`) para receber avisos quando precisar de atendimento humano.

5. Personalize o conteúdo em **`src/conteudo.js`**: horários, preços, endereço, regras, etc.

## Como rodar

```bash
npm start
```

Na primeira vez será exibido um **QR Code** no terminal. Abra o WhatsApp no celular:

- **Android**: Menu (⋮) → Aparelhos conectados → Conectar um aparelho  
- **iPhone**: Ajustes → Aparelhos conectados → Conectar um aparelho  

Escaneie o QR Code. Depois disso, a sessão fica salva na pasta `.wwebjs_auth` e nas próximas vezes o robô conecta sem precisar escanear de novo (a menos que você apague essa pasta ou desvincule o dispositivo).

## Estrutura do projeto

```
Projeto Robo Whats/
├── src/
│   ├── index.js      # Inicialização do WhatsApp e tratamento de mensagens
│   ├── config.js     # Nome do clube, número de escalação, mensagens padrão
│   ├── conteudo.js   # Menu e todas as respostas (horários, preços, etc.)
│   ├── handlers.js   # Lógica que decide o que responder
│   └── escalacao.js  # Quando e como escalar para atendimento humano
├── .env              # Suas variáveis (não versionar)
├── .env.example      # Exemplo de variáveis
└── package.json
```

## Personalização

- **Textos e respostas**: edite `src/conteudo.js` (horários, preços, endereço, regras).
- **Nome do clube e número de escalação**: `.env` ou `src/config.js`.
- **Quantas vezes “não entendi” antes de escalar**: em `src/escalacao.js`, altere `MAX_NAO_ENTENDIDO_PARA_ESCALAR` (padrão: 2).

## Uso em VPS Linux

Para rodar em um servidor Linux (Ubuntu, Debian, etc.):

1. **Instale Node.js 18+ e Chromium** no servidor (ex.: `sudo apt install nodejs chromium-browser`).
2. **Clone o repositório**, rode `npm install`, crie e edite o `.env`.
3. **Primeira vez:** execute `npm start`, escaneie o QR Code no terminal e pare com `Ctrl+C`.
4. **Em segundo plano:** use **PM2** (`pm2 start src/index.js --name ctc-robo`) ou o **systemd** (arquivo em `deploy/ctc-robo-whats.service`).

O robô detecta Chromium em `/usr/bin/chromium` ou `/usr/bin/chromium-browser` automaticamente. Para outro caminho, defina no `.env`:

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

Instruções detalhadas: **[deploy/README-VPS.md](deploy/README-VPS.md)**.

---

## Deploy no Render (ou outro PaaS)

### Opção 1: Deploy com Docker (recomendado)

O projeto inclui um **Dockerfile** que usa Chromium instalado pelo sistema. No Render é mais estável que depender do download do Puppeteer no build.

1. No Render, crie um **Web Service** e conecte o repositório.
2. Em **Settings** → **Build & Deploy**:
   - **Environment:** Docker
   - O Render detecta o `Dockerfile` automaticamente.
3. **Variáveis de ambiente:** adicione as do `.env` (por exemplo `NOME_CLUBE`, `NUMERO_ATENDIMENTO_HUMANO`). O Chromium já vem configurado na imagem.
4. Faça o deploy. Na primeira vez, abra os **logs** e escaneie o QR Code com o WhatsApp (Aparelhos conectados).

### Opção 2: Deploy nativo (Node)

Se não usar Docker, configure:

1. **Variáveis de ambiente:** `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `false`, `PUPPETEER_CACHE_DIR` = `./cache/puppeteer`.
2. **Build Command:** `npm install`  
3. **Start Command:** `node src/index.js`  

O download do Chrome no build pode falhar por rede; nesse caso use a **Opção 1 (Docker)**.

---

## Aviso

O uso de automação no WhatsApp pode violar os termos de uso da plataforma. Use por sua conta e risco e prefira números secundários para testes.

## Licença

MIT.
