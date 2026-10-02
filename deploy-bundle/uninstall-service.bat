@echo off
REM ============================================================
REM  VAY365 - Go Windows Service
REM ============================================================
net session >nul 2>&1
if errorlevel 1 (
    echo [LOI] Can chay voi quyen Administrator.
    pause
    exit /b 1
)

cd /d "%~dp0"
set NSSM=%~dp0tools\nssm\win64\nssm.exe

net stop VAY365Web >nul 2>&1
if exist "%NSSM%" (
    "%NSSM%" stop VAY365Web
    "%NSSM%" remove VAY365Web confirm
) else (
    sc delete VAY365Web
)
echo [OK] Da go service VAY365Web.
pause
