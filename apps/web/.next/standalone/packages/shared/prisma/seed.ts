import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('admin123456', 12);
  const salePass = await bcrypt.hash('sale123456', 12);

  await prisma.user.upsert({
    where: { phone: '0900000001' },
    update: { email: 'admin@vay365.com', passwordHash: adminPass, name: 'Admin', role: 'admin' },
    create: { phone: '0900000001', email: 'admin@vay365.com', passwordHash: adminPass, name: 'Admin', role: 'admin' },
  });

  await prisma.user.upsert({
    where: { phone: '0900000002' },
    update: { email: null, telegramLink: 'https://t.me/your_sale', passwordHash: salePass, name: 'Sale', role: 'agent' },
    create: { phone: '0900000002', email: null, telegramLink: 'https://t.me/your_sale', passwordHash: salePass, name: 'Sale', role: 'agent' },
  });

  console.log('Seed done: 0900000001 / admin123456, 0900000002 / sale123456');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
