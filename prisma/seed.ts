import { PrismaClient, RoleEnum } from '@prisma/client';
import * as argon from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    if (existing.role !== RoleEnum.ADMIN) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: RoleEnum.ADMIN } });
    }
    console.log('Admin já existente:', adminEmail);
    return;
  }

  const passwordHash = await argon.hash(adminPassword);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: RoleEnum.ADMIN,
    },
  });
  console.log('Admin criado:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


