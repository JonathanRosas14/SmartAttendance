FROM node:20-alpine

WORKDIR /app

# Instalar Expo CLI y ngrok globalmente
RUN npm install -g expo-cli @expo/ngrok@^4.1.0

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código
COPY . .

EXPOSE 8081 19000 19001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:19000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["npx", "expo", "start", "--tunnel"]