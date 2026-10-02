@echo off
REM ============================================================
REM  VAY365 - Stop server
REM ============================================================
setlocal
echo [INFO] Dang dung VAY365...

taskkill /FI "WINDOWTITLE eq VAY365 Server*" /T /F >nul 2>nul

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

for /f "tokens=2" %%p in ('wmic process where "name='node.exe' and commandline like '%%apps\web\server.js%%'" get processid /format:value 2^>nul') do (
    if not "%%p"=="" taskkill /F /PID %%p >nul 2>nul
)

echo [OK] Da dung.
timeout /t 2 /nobreak >nul
