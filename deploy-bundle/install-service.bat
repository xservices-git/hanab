@echo off
REM ============================================================
REM  VAY365 - Cai dat nhu Windows Service (auto-restart khi reboot)
REM  Can chay voi quyen Administrator.
REM ============================================================
net session >nul 2>&1
if errorlevel 1 (
    echo [LOI] Can chay voi quyen Administrator.
    echo       Click phai file nay, chon "Run as administrator".
    pause
    exit /b 1
)

cd /d "%~dp0"
cscript //nologo install-service.vbs
