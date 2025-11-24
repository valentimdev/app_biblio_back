# --- Estágio 1: Builder ---
# Usamos uma imagem Node "alpine" (leve) para construir o projeto
FROM node:18 AS builder

WORKDIR /app

# Copia os arquivos de definição do projeto
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies)
RUN npm install

# Copia todo o resto do código-fonte
COPY . .

# Gera o cliente Prisma (necessário antes do build)
RUN npx prisma generate

# Roda o script de build do seu package.json ("build": "nest build")
RUN npm run build

# --- Estágio 2: Production ---
# Começamos de uma imagem Node limpa e leve
FROM node:18

WORKDIR /app

# Copia os package.json para instalar SOMENTE deps de produção
COPY package*.json ./

# Instala apenas as dependências de produção
# (ts-node e typescript serão instalados, graças à Etapa 1)
RUN npm install --only=production

# Copia a pasta 'dist' (app compilado) do estágio builder
COPY --from=builder /app/dist ./dist

# Copia a pasta 'prisma' (schema e migrações) do estágio builder
COPY --from=builder /app/prisma ./prisma

# (Opcional) Gera o cliente Prisma novamente, por garantia
RUN npx prisma generate

# Copia o entrypoint.sh e start.js (da próxima etapa)
COPY entrypoint.sh .
COPY start.js .
RUN chmod +x entrypoint.sh

# Expõe a porta que sua aplicação NestJS usa (padrão 3000)
# Se você mudou no seu src/main.ts, mude aqui também.
EXPOSE 3000

# O comando para iniciar a aplicação
# Usamos o entrypoint.sh para rodar migrações e seed primeiro
CMD ["./entrypoint.sh"]