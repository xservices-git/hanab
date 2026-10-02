@echo off
REM ============================================================
REM  VAY365 - Silent Background Starter
REM  Chay server trong cua so rieng, dong terminal van chay
REM  Entry point: apps\web\server.js
REM ============================================================
setlocal enableextensions
cd /d "%~dp0"
if not exist logs mkdir logs

start "VAY365 Server" /min cmd /c "cd /d %~dp0apps\web && node server.js > %~dp0logs\server.log 2>&1"

timeout /t 2 /nobreak >nul

netstat -an | find ":3000 " | find "LISTENING" >nul
if errorlevel 1 (
    echo [LOI] Server khong khoi dong. Xem logs\server.log
    type logs\server.log
    pause
) else (
    echo [OK] VAY365 dang chay tren cong 3000
    echo      Xem log: logs\server.log
    echo      Dung server: stop.bat
)
