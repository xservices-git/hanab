$ErrorActionPreference = "Stop"
$root = "C:\Users\X\Downloads\mbvay-master (1)\mbvay-master"
$deploySrc = Join-Path $root "deploy"               # scripts + .env
$dst  = Join-Path $root "deploy-bundle"     # build tam thoi
$zip  = Join-Path $root "vay365-prod.zip"
$webRoot = Join-Path $root "apps\web"
$src  = Join-Path $webRoot ".next/standalone"        # CUA Next.js standalone

# Xoa build cu
if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
New-Item -ItemType Directory -Path $dst | Out-Null

# Kiem tra source
if (-not (Test-Path "$src\apps\web\server.js")) {
    Write-Host "[LOI] Khong thay $src\apps\web\server.js" -ForegroundColor Red
    Write-Host "       Ban da build Next.js standalone chua? (next build --webpack)" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/8] Copy NOI DUNG standalone\ (giai nen ra root)..." -ForegroundColor Cyan
# $src = apps\web/.next/standalone  (day LA 1 folder)
# Khong copy ca folder, ma copy NOI DUNG ben trong no ra $dst
Get-ChildItem -Path $src -Force | ForEach-Object {
    $dest = Join-Path $dst $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}

Write-Host "[2/8] Copy .next/static + public cua web..." -ForegroundColor Cyan
$dstWebNext = Join-Path $dst "apps\web\.next"
New-Item -ItemType Directory -Path $dstWebNext -Force | Out-Null
Copy-Item -Path "$webRoot\.next\static" -Destination "$dstWebNext\static" -Recurse -Force
Copy-Item -Path "$webRoot\public" -Destination (Join-Path $dst "apps\web\public") -Recurse -Force

Write-Host "[3/8] Copy prisma..." -ForegroundColor Cyan
# Prisma phai nam o root, hoac o apps\web\prisma? Mac dinh schema dat o $root\prisma
# O day copy vao root\prisma (start.bat doc $ROOT%\prisma\schema.prisma)
Copy-Item -Path "$root\packages\shared\prisma" -Destination (Join-Path $dst "prisma") -Recurse -Force
# Xoa node_modules trong prisma (neu co)
Get-ChildItem -Path (Join-Path $dst "prisma") -Recurse -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -eq "node_modules" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[4/8] Copy packages\shared..." -ForegroundColor Cyan
if (Test-Path (Join-Path $dst "packages\shared")) {
    # Standalone da copy 1 phan; dam bao day du
    Get-ChildItem -Path "$root\packages\shared" -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notmatch '\\node_modules' -and $_.FullName -notmatch '\\dist' } |
      ForEach-Object {
          $rel = $_.FullName.Substring($root.Length).TrimStart('\').Substring("packages\shared\".Length)
          $dstPath = Join-Path $dst "packages\shared\$rel"
          $dstDir  = Split-Path $dstPath -Parent
          if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
          Copy-Item -Path $_.FullName -Destination $dstPath -Force
      }
}

Write-Host "[5/8] Copy .env + scripts tu deploy\..." -ForegroundColor Cyan
# QUAN TRONG: luon lay .env tu deploy\.env (day la file production)
$envSrc = Join-Path $deploySrc ".env"
if (Test-Path $envSrc) {
    Copy-Item -Path $envSrc -Destination (Join-Path $dst ".env") -Force
    Write-Host "         + .env (from deploy\.env)" -ForegroundColor DarkGray
    $firstLine = (Get-Content $envSrc -TotalCount 1)
    Write-Host "         Content: $firstLine" -ForegroundColor DarkGray
} else {
    Write-Host "         [LOI] Khong tim thay deploy\.env - ban can tao truoc!" -ForegroundColor Red
    exit 1
}

# Dam bao apps/web cung co .env (prisma generate doc o day)
Copy-Item -Path $envSrc -Destination (Join-Path $dst "apps\web\.env") -Force

$scripts = @("start.bat","start-bg.bat","stop.bat","status.bat",
             "install-service.bat","uninstall-service.bat",
             "install-nssm.ps1","install-service.vbs",
             "ecosystem.config.cjs","README.txt",".env.example")
$copied = 0
foreach ($s in $scripts) {
    $p = Join-Path $deploySrc $s
    if (Test-Path $p) {
        Copy-Item -Path $p -Destination (Join-Path $dst $s) -Force
        Write-Host "         + $s" -ForegroundColor DarkGray
        $copied++
    }
}
Write-Host "         (da copy $copied script)" -ForegroundColor DarkGray

Write-Host "[6/8] Tao logs dir..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path (Join-Path $dst "logs") -Force | Out-Null

Write-Host "[7/8] Tao server.js shortcut o root cho de go..." -ForegroundColor Cyan
# Tao file .bat wrapper o root: start tu apps/web/server.js
$wrapper = @"
@echo off
REM Wrapper de chay server.js (vi start.bat cu chi go node server.js o cwd hien tai)
cd /d "%~dp0"
set "WEB_DIR=%~dp0apps\web"
echo Switching to: %WEB_DIR%
cd /d "%WEB_DIR%"
node server.js
"@
Set-Content -Path (Join-Path $dst "run-server.bat") -Value $wrapper -Encoding ASCII

Write-Host "[8/8] Zip..." -ForegroundColor Cyan
Compress-Archive -Path "$dst\*" -DestinationPath $zip -CompressionLevel Optimal -Force

$size = [math]::Round((Get-Item $zip).Length / 1MB, 2)
Write-Host ""
Write-Host "DONE: $zip ($size MB)" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "=== Cau truc zip ===" -ForegroundColor Green
Write-Host "  vay365-prod\" -ForegroundColor White
Write-Host "  +-- .env                  (PORT 3306, copy tu deploy\.env)" -ForegroundColor White
Write-Host "  +-- apps\web\server.js    (entry point that that)" -ForegroundColor White
Write-Host "  +-- apps\web\.next\static\" -ForegroundColor White
Write-Host "  +-- apps\web\public\" -ForegroundColor White
Write-Host "  +-- prisma\               (schema + migrations + seed)" -ForegroundColor White
Write-Host "  +-- packages\shared\" -ForegroundColor White
Write-Host "  +-- node_modules\         (Next.js bundled)" -ForegroundColor White
Write-Host "  +-- start.bat             (chay tu apps\web\server.js)" -ForegroundColor White
Write-Host "  +-- run-server.bat        (wrapper go server.js)" -ForegroundColor White
Write-Host "  +-- logs\" -ForegroundColor White
Write-Host ""
Write-Host "=== Server bat buoc chay tu apps\web\, KHONG PHAI root ===" -ForegroundColor Yellow
Write-Host "=== start.bat se tu cd vao apps\web\ truoc khi go node server.js ===" -ForegroundColor Yellow
