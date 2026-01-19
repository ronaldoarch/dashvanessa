FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
# Não definir NODE_ENV aqui para garantir que devDependencies sejam instaladas
RUN npm ci --include=dev || npm install

# Copiar código fonte
COPY . .

# Build da aplicação Next.js
# Definir NODE_ENV apenas durante o build
ENV NEXT_TELEMETRY_DISABLED=1
RUN NODE_ENV=production npm run build

# Expor porta
EXPOSE 3000

# Definir NODE_ENV para produção apenas no runtime
ENV NODE_ENV=production

# Comando para iniciar
CMD ["npm", "start"]
