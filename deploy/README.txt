=== VAY365 PRODUCTION BUNDLE ===
Cau truc:
  server.js              - Entry point Next.js standalone
  .env                   - Bien moi truong production (SUA truoc khi chay)
  .next/static/          - Static assets
  public/                - Public files
  prisma/                - Prisma schema + migrations
  packages/shared/       - Shared package
  start.bat              - Chay nhanh (test)
  ecosystem.config.cjs   - PM2 config

Cai dat:
  1) Sua file .env neu can (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL)
  2) Chay migration lan dau:
       npx prisma migrate deploy --schema=prisma/schema.prisma
  3) Chay production:
       start.bat
     hoac:
       npm i -g pm2
       pm2 start ecosystem.config.cjs
       pm2 save
