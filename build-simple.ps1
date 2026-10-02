$ErrorActionPreference = "Stop"
$root = "C:\Users\X\Downloads\mbvay-master (1)\mbvay-master"
$web  = Join-Path $root "apps\web"
$src  = Join-Path $web  ".next/standalone"
$dst  = Join-Path $root "deploy"
$zip  = Join-Path $root "vay365-prod.zip"

foreach ($name in @("standalone","node_modules","prisma","packages","apps","static-backup","public-backup","logs")) {
    $p = Join-Path $dst $name
    if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}
if (Test-Path $zip) { Remove-Item $zip -Force }

# Copy noi dung standalone (bao gom .env va run-server.bat tu bundle)
Copy-Item $src $dst -Recurse -Force
Copy-Item "$web\.next\static" "$dst\apps\web\.next\static" -Recurse -Force
Copy-Item "$web\public"       "$dst\apps\web\public"       -Recurse -Force
Copy-Item "$root\packages\shared\prisma" "$dst\prisma" -Recurse -Force
Copy-Item "$root\packages\shared" "$dst\packages\shared" -Recurse -Force
Get-ChildItem "$dst\packages\shared" -Recurse -Directory |
    Where-Object { $_.Name -in 'node_modules','dist','build' } |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Lay .env tu deploy\.env (skip neu cunghoai truc)
$envSrc = "$root\deploy\.env"
$dstEnv = Join-Path $dst ".env"
if (Test-Path $envSrc) {
    $srcResolved = (Resolve-Path $envSrc).Path
    try { $dstResolved = (Resolve-Path $dstEnv).Path } catch { $dstResolved = "" }
    if ($srcResolved -ne $dstResolved) {
        Copy-Item $envSrc $dstEnv -Force
    }
}

# Lay run-server.bat tu deploy-bundle\ va rename vs @thay the start.bat
$runnerSrc = "$root\deploy-bundle\run-server.bat"
if (Test-Path $runnerSrc) {
    Copy-Item $runnerSrc "$dst\run-server.bat" -Force
}

Compress-Archive -Path "$dst\*" -DestinationPath $zip -CompressionLevel Optimal -Force
$mb = [math]::Round((Get-Item $zip).Length / 1MB, 2)
Write-Host ""
Write-Host "DONE: $zip ($mb MB)" -ForegroundColor Green