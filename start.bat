@echo off
REM Chay server VAY365 (standalone build)
REM Chay tu root project: D:\standalone\start.bat
REM Luon import db truoc: import-db.bat

cd /d "%~dp0"
if not exist "package.json" cd ..

REM Kiem tra database co san chua (khong can prisma, dung mysql client)
set "DB_NAME=vay365"
set "SQL_FILE=%~dp0db\schema.sql"

if not exist "%SQL_FILE%" (
    echo LOI: Khong tim thay db\schema.sql
    pause
    exit /b 1
)

REM Chay server (standalone da co node_modules + .env)
echo.
echo ============================================================
echo  VAY365 running at http://localhost:3000
echo  Nhan Ctrl+C de thoat.
echo ============================================================
node apps\web\.next\standalone\apps\web\server.js
goto :eof

:err
echo LOI: %errorlevel%
pause