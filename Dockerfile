# Imagem com Node e Chromium instalado pelo sistema (evita download do Puppeteer no build)
FROM node:20-bookworm-slim

# Instala Chromium e dependências mínimas para rodar headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Chromium no Debian Bookworm fica aqui
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

CMD ["node", "src/index.js"]
