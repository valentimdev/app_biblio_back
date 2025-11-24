#!/bin/sh

# Para o script se qualquer comando falhar
set -e

# 1. Roda as migrações
echo "Railway: Running Prisma migrations..."
npx prisma migrate deploy

# 2. RODA A SEED (para criar seu admin)
echo "Railway: Running database seed..."
npx prisma db seed

# 3. Inicia a aplicação (o seu "start:prod")
echo "Railway: Starting NestJS application..."
node start.js