// prisma/seed.ts
import { PrismaClient, RoleEnum } from '@prisma/client';
import * as argon from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding...');

  const adminPassword = await argon.hash('123456');


  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' }, 
    update: {},
    create: {
      email: 'admin@admin.com',
      name: 'Administrador',
      passwordHash: adminPassword,
      role: RoleEnum.ADMIN,
      matricula: 'ADMIN001',
    },
  });

  console.log(`Usuário Admin criado/verificado: ${admin.email}`);
  console.log('Seeding finalizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });