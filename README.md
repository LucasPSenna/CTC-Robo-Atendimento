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

## Aviso

O uso de automação no WhatsApp pode violar os termos de uso da plataforma. Use por sua conta e risco e prefira números secundários para testes.

## Licença

MIT.
