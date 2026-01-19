FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
# Definir NODE_ENV=development durante instalação para garantir devDependencies
RUN NODE_ENV=development npm ci

# Copiar código fonte
COPY . .

# Build da aplicação Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Expor porta
EXPOSE 3000

# Definir NODE_ENV para produção apenas no runtime
ENV NODE_ENV=production

# Comando para iniciar
CMD ["npm", "start"]
