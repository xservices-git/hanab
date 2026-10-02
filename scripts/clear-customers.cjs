const fs = require('fs');
const path = require('path');
for (const file of ['.env', '.env.local', 'apps/web/.env.local', 'apps/worker/.env']) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)\s*$/);
    if (!m) continue;
    const key = m[1].trim();
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const before = await Promise.all([
    prisma.user.count({ where: { role: 'user' } }),
    prisma.loan.count(),
    prisma.customerProfile.count(),
    prisma.kycProfile.count(),
    prisma.bankAccount.count(),
    prisma.contract.count(),
  ]);

  const deleted = await prisma.user.deleteMany({ where: { role: 'user' } });

  const after = await Promise.all([
    prisma.user.count({ where: { role: 'user' } }),
    prisma.loan.count(),
    prisma.customerProfile.count(),
    prisma.kycProfile.count(),
    prisma.bankAccount.count(),
    prisma.contract.count(),
  ]);

  console.log(JSON.stringify({
    deletedCustomers: deleted.count,
    before: { customers: before[0], loans: before[1], profiles: before[2], kycs: before[3], banks: before[4], contracts: before[5] },
    after: { customers: after[0], loans: after[1], profiles: after[2], kycs: after[3], banks: after[4], contracts: after[5] },
  }, null, 2));
}

main().finally(async () => prisma.$disconnect());
