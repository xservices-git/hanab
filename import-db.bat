@echo off
REM Import schema VAY365 vao MySQL
REM Su dung: import-db.bat (se hoi pass), hoac import-db.bat <mysql_root_pass>

set "MYSQL_HOST=localhost"
set "MYSQL_PORT=3306"
set "MYSQL_USER=root"
set "DB_NAME=vay365"

if "%~1"=="" (
    set /p MYSQL_PASS=Nhap MySQL password cho user %MYSQL_USER%:
) else (
    set "MYSQL_PASS=%~1"
)

set "SQL_FILE=%~dp0db\schema.sql"
if not exist "%SQL_FILE%" (
    echo LOI: Khong tim thay %SQL_FILE%
    pause
    exit /b 1
)

echo.
echo Dang import %SQL_FILE% vao %MYSQL_HOST%:%MYSQL_PORT%\%DB_NAME% ...
echo.

mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p"%MYSQL_PASS%" < "%SQL_FILE%"
if errorlevel 1 (
    echo.
    echo LOI: Import that bai. Kiem tra password, MySQL da chay, port 3306.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Import thanh cong! Database '%DB_NAME%'.
echo ============================================================
pause
