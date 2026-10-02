$ErrorActionPreference = "Stop"
$root   = "C:\Users\X\Downloads\mbvay-master (1)\mbvay-master"
$src    = Join-Path $root "apps\web/.next/standalone"
$dst    = Join-Path $root "deploy"
$zip    = Join-Path $root "vay365-prod.zip"

if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
New-Item -ItemType Directory -Path $dst | Out-Null

# 1. Copy standalone server
Copy-Item -Path $src -Destination $dst -Recurse -Force

# 2. Copy static assets (.next/static) - bat buoc, nam ngoai standalone
$dstNext = Join-Path $dst ".next"
New-Item -ItemType Directory -Path $dstNext -Force | Out-Null
Copy-Item -Path "$root/apps/web/.next/static" -Destination "$dstNext/static" -Recurse -Force

# 3. Copy public folder
Copy-Item -Path "$root/apps/web/public" -Destination (Join-Path $dst "public") -Recurse -Force

# 4. Copy env
Copy-Item -Path "$root/apps/web/.env" -Destination (Join-Path $dst ".env") -Force

# 5. Copy prisma (schema + migrations) cho buoc migrate
Copy-Item -Path "$root/packages/shared/prisma" -Destination (Join-Path $dst "prisma") -Recurse -Force

# 6. Copy shared package source
Copy-Item -Path "$root/packages/shared" -Destination (Join-Path $dst "packages/shared") -Recurse -Force
Get-ChildItem -Path (Join-Path $dst "packages/shared") -Recurse -Force |
  Where-Object { $_.Name -in @("node_modules","dist","tsconfig.tsbuildinfo") } |
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 7. Tao start.bat de test nhanh
$startBat = @"
@echo off
setlocal
set NODE_ENV=production
set HOSTNAME=0.0.0.0
set PORT=3000
node server.js
"@
$startBat | Set-Content -Path (Join-Path $dst "start.bat") -Encoding ASCII

# 8. Tao ecosystem.config.cjs cho PM2
$ecosystem = @"
module.exports = {
  apps: [{
    name: 'mbvay-web',
    script: 'server.js',
    cwd: '$($dst -replace '\\','/')',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: { NODE_ENV: 'production', HOSTNAME: '0.0.0.0', PORT: 3000 },
    error_file: 'logs/pm2-error.log',
    out_file:   'logs/pm2-out.log',
    time: true,
  }]
};
"@
$ecosystem | Set-Content -Path (Join-Path $dst "ecosystem.config.cjs") -Encoding ASCII

New-Item -ItemType Directory -Path (Join-Path $dst "logs") -Force | Out-Null

# 9. Tao readme huong dan ngan
$readme = @"
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
"@
$readme | Set-Content -Path (Join-Path $dst "README.txt") -Encoding UTF8

# 10. Nen zip
Compress-Archive -Path (Join-Path $dst "*") -DestinationPath $zip -Force

$size = [math]::Round((Get-Item $zip).Length / 1MB, 2)
Write-Host "DONE: $zip ($size MB)" -ForegroundColor Green
Write-Host "Folder: $dst"
