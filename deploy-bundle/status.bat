@echo off
REM ============================================================
REM  VAY365 - Kiem tra trang thai server
REM ============================================================
cd /d "%~dp0"

set PORT=3000
if exist .env (
    for /f "tokens=2 delims==" %%a in ('findstr /b "PORT=" .env') do set PORT=%%a
)
if "%PORT%"=="" set PORT=3000

echo.
echo === Trang thai VAY365 ===
echo.

tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /i "node.exe" >nul
if errorlevel 1 (
    echo Process:    DUNG
) else (
    echo Process:    DANG CHAY
)

netstat -an | find ":%PORT% " | find "LISTENING" >nul
if errorlevel 1 (
    echo Port %PORT%: DONG
) else (
    echo Port %PORT%: MO
)

sc query VAY365Web >nul 2>&1
if errorlevel 1 (
    echo Service:    Khong cai
) else (
    for /f "tokens=4" %%s in ('sc query VAY365Web ^| find "STATE"') do echo Service:    %%s
)

echo.
echo === Test HTTP ===
curl -s -o nul -w "HTTP Status: %%{http_code}  Time: %%{time_total}s^n" http://localhost:%PORT% 2>nul
if errorlevel 1 (
    echo Khong the ket noi http://localhost:%PORT%
)

echo.
echo === Log gan nhat (10 dong cuoi) ===
if exist logs\server.log (
    powershell -NoProfile -Command "Get-Content 'logs\server.log' -Tail 10"
) else (
    echo (chua co log)
)
echo.
pause
