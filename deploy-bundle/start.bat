@echo off
REM ============================================================
REM  VAY365 - All-in-one Starter
REM  Tu load .env, kiem tra MySQL, migrate Prisma, seed (optional),
REM  roi khoi dong production server.
REM ============================================================
setlocal enableextensions enabledelayedexpansion
chcp 65001 >nul

cd /d "%~dp0"
set "ROOT=%cd%"
set "WEB_DIR=%ROOT%\apps\web"
set "LOGS=%ROOT%\logs"
set "PRISMA_SCHEMA=%ROOT%\prisma\schema.prisma"

if not exist "%LOGS%" mkdir "%LOGS%"

echo.
echo  ============================================================
echo    VAY365 - All-in-one Starter
echo  ============================================================
echo.

REM 1) Kiem tra Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo  [LOI] Khong tim thay node.exe. Cai Node.js 20+ tai https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo  [OK] Node: %%v

REM 2) Load .env
echo  [1/5] Dang load .env...
if not exist ".env" (
    echo  [LOI] Khong tim thay file .env
    pause & exit /b 1
)

for /f "usebackq tokens=1* delims==" %%a in (".env") do (
    set "line=%%a"
    if not "!line!"=="" if not "!line:~0,1!"=="#" (
        set "%%a=%%b"
    )
)

if "%NODE_ENV%"=="" set NODE_ENV=production
if "%PORT%"=="" set PORT=3000
if "%HOSTNAME%"=="" set HOSTNAME=0.0.0.0
echo         DATABASE_URL: %DATABASE_URL%
echo         PORT:         %PORT%

REM 3) Kiem tra MySQL
echo  [2/5] Kiem tra MySQL...
set "DB_HOST=127.0.0.1"
set "DB_PORT=3306"
for /f "tokens=2 delims=@" %%a in ("%DATABASE_URL%") do (
    for /f "tokens=1 delims=/" %%h in ("%%a") do (
        for /f "tokens=1,2 delims=:" %%x in ("%%h") do (
            set "DB_HOST=%%x"
            set "DB_PORT=%%y"
        )
    )
)
if "%DB_PORT%"=="" set "DB_PORT=3306"

set "MYSQL_OK=0"
for /f %%p in ('powershell -NoProfile -Command "$c=Get-NetTCPConnection -LocalPort %DB_PORT% -State Listen -ErrorAction SilentlyContinue; if($c){'up'}else{'down'}"') do set "MYSQL_OK=%%p"

if "%MYSQL_OK%"=="down" (
    echo  [LOI] MySQL chua chay tren %DB_HOST%:%DB_PORT%
    echo         Hay khoi dong XAMPP hoac kiem tra DATABASE_URL.
    pause & exit /b 1
)
echo         MySQL: OK ^(%DB_HOST%:%DB_PORT%^)

REM 4) Kiem tra / tao database
echo  [3/5] Kiem tra database...
set "DB_NAME="
for /f "tokens=2 delims=/" %%a in ("%DATABASE_URL%") do (
    for /f "tokens=1 delims=?" %%b in ("%%a") do set "DB_NAME=%%b"
)
set "DB_NAME=%DB_NAME:"=%"

set "DB_USER=root"
set "DB_PASS="
for /f "tokens=2 delims=//" %%a in ("%DATABASE_URL%") do (
    for /f "tokens=1 delims=@" %%b in ("%%a") do (
        for /f "tokens=1,2 delims=:" %%c in ("%%b") do (
            set "DB_USER=%%c"
            set "DB_PASS=%%d"
        )
    )
)
set "DB_PASS=%DB_PASS:"=%"

set "HAS_MYSQL_CLI=0"
where mysql >nul 2>nul && set "HAS_MYSQL_CLI=1"

set "DB_EXISTS=0"
if "%HAS_MYSQL_CLI%"=="1" (
    if "%DB_PASS%"=="" (
        mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -e "USE %DB_NAME%;" >nul 2>nul && set "DB_EXISTS=1"
    ) else (
        mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% -e "USE %DB_NAME%;" >nul 2>nul && set "DB_EXISTS=1"
    )
) else (
    node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.$queryRawUnsafe('USE \`%DB_NAME%\`').then(()=>{console.log('EXISTS');process.exit(0)}).catch(()=>{console.log('MISSING');process.exit(1)}).finally(()=>p.$disconnect())" 2>nul | find "EXISTS" >nul && set "DB_EXISTS=1"
)

if "%DB_EXISTS%"=="0" (
    echo         Database "%DB_NAME%" CHUA TON TAI.
    set "CREATE_DB="
    set /p "CREATE_DB=         Tao database "%DB_NAME%" ngay? (Y/N): "
    if /i "!CREATE_DB!"=="Y" (
        if "%HAS_MYSQL_CLI%"=="1" (
            if "%DB_PASS%"=="" (
                mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS `%DB_NAME%` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            ) else (
                mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS `%DB_NAME%` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        ) else (
            node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.$executeRawUnsafe('CREATE DATABASE IF NOT EXISTS \`%DB_NAME%\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci').then(()=>{console.log('OK')}).finally(()=>p.$disconnect())" >nul 2>nul
        )
        echo         Da tao database "%DB_NAME%".
    ) else (
        echo  [LOI] Can tao database truoc khi chay.
        pause & exit /b 1
    )
) else (
    echo         Database: OK ^("%DB_NAME%"^)
)

REM 5) Prisma migrate
echo  [4/5] Prisma migrate deploy...
if not exist "%PRISMA_SCHEMA%" (
    echo  [LOI] Khong tim thay schema: %PRISMA_SCHEMA%
    pause & exit /b 1
)

if not exist "node_modules\prisma" (
    echo         Cai dat prisma CLI...
    call npm install --no-save --no-audit --no-fund --prefer-offline prisma@5 >nul 2>nul
    if errorlevel 1 (
        echo  [LOI] npm install prisma that bai. Kiem tra mang.
        pause & exit /b 1
    )
)

call npx prisma migrate deploy --schema="%PRISMA_SCHEMA%" 2>&1 | tee "%LOGS%\migrate.log"
if errorlevel 1 (
    echo  [LOI] Migrate that bai. Xem logs\migrate.log
    pause & exit /b 1
)
echo         Migrate: OK

set "SEED="
set /p "SEED=         Seed du lieu mau (admin, test user)? (Y/N): "
if /i "%SEED%"=="Y" (
    echo         Dang seed...
    if exist "packages\shared\prisma\seed.ts" (
        call npx ts-node packages\shared\prisma\seed.ts 2>&1 | tee "%LOGS%\seed.log"
    ) else if exist "prisma\seed.ts" (
        call npx ts-node prisma\seed.ts 2>&1 | tee "%LOGS%\seed.log"
    ) else (
        echo         (khong co file seed.ts, bo qua)
    )
)

if not exist "node_modules\.prisma\client\index.d.ts" (
    echo         Generate Prisma client...
    call npx prisma generate --schema="%PRISMA_SCHEMA%" >nul 2>nul
)

REM 6) Khoi dong server
echo  [5/5] Khoi dong server...
echo.
echo  ============================================================
echo    Server URL:    http://%HOSTNAME%:%PORT%
echo    NODE_ENV:     %NODE_ENV%
echo    Log file:     %LOGS%\server.log
echo    Bam Ctrl+C de dung.
echo  ============================================================
echo.

REM Entry point: apps\web\server.js (Next.js standalone)
cd /d "%WEB_DIR%"
node server.js 2>&1 | tee "%LOGS%\server.log"
