@echo off
REM Wrapper de chay server.js + auto gen Prisma client + tao table MySQL
cd /d "%~dp0"
set "WEB_DIR=%~dp0apps\web"
echo Switching to: %WEB_DIR%
cd /d "%WEB_DIR%"
call npx prisma migrate deploy --schema="..\prisma\schema.prisma"
call npx prisma generate
node server.js