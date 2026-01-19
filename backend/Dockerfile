FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias para Prisma
RUN apk add --no-cache openssl

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (incluindo devDependencies para build)
# Definir NODE_ENV=development durante instalação para garantir devDependencies
RUN NODE_ENV=development npm ci

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build da aplicação TypeScript
RUN npm run build

# Expor porta
EXPOSE 3001

# Definir NODE_ENV para produção apenas no runtime
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Comando para iniciar
CMD ["npm", "start"]
