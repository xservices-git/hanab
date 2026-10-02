@echo off
REM Test MySQL connection + list tables
set "DB_NAME=vay365"

if "%~1"=="" (
    set /p MYSQL_PASS=Nhap MySQL password cho user root:
) else (
    set "MYSQL_PASS=%~1"
)

echo.
echo === Test ket noi MySQL ===
mysql -u root -p"%MYSQL_PASS%" -e "SELECT VERSION();" 2>nul
if errorlevel 1 (
    echo LOI: Khong ket noi duoc MySQL. Kiem tra pass + service.
    pause
    exit /b 1
)

echo.
echo === List databases ===
mysql -u root -p"%MYSQL_PASS%" -e "SHOW DATABASES;" 2>nul

echo.
echo === Tables trong '%DB_NAME%' ===
mysql -u root -p"%MYSQL_PASS%" -e "USE %DB_NAME%; SHOW TABLES;" 2>nul
if errorlevel 1 (
    echo.
    echo CHUA CO DATABASE '%DB_NAME%'. Chay import-db.bat de tao.
)

echo.
pause
