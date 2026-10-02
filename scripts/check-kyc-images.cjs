const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const profiles = await p.customerProfile.findMany({
    take: 5,
    include: {
      user: { select: { phone: true, name: true } },
      kycs: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, status: true, frontIdUrl: true } },
    },
  });
  console.log(JSON.stringify(profiles.map((x) => ({
    phone: x.user?.phone,
    name: x.user?.name,
    profileId: x.id,
    hasKyc: x.kycs.length,
    kycStatus: x.kycs[0]?.status,
    front: x.kycs[0]?.frontIdUrl ? 'YES (' + x.kycs[0].frontIdUrl.length + ' chars)' : 'NO',
  })), null, 2));
  await p.$disconnect();
})();