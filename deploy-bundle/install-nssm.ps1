$ErrorActionPreference = "Stop"
$dest = Join-Path $PSScriptRoot "tools\nssm"
$zip  = Join-Path $dest "nssm.zip"
$url  = "https://nssm.cc/release/nssm-2.24.zip"

if (Test-Path (Join-Path $dest "win64\nssm.exe")) {
    Write-Host "NSSM da co san." -ForegroundColor Green
    exit 0
}

New-Item -ItemType Directory -Path $dest -Force | Out-Null
Write-Host "Dang tai NSSM tu $url ..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

Write-Host "Giai nen..." -ForegroundColor Cyan
Expand-Archive -Path $zip -DestinationPath $dest -Force

$extracted = Get-ChildItem -Path $dest -Directory | Where-Object { $_.Name -like "nssm-*" } | Select-Object -First 1
if ($extracted) {
    Get-ChildItem -Path $extracted.FullName -Recurse | Move-Item -Destination $dest -Force
    Remove-Item $extracted.FullName -Recurse -Force
}
Remove-Item $zip -Force

Write-Host "NSSM da cai xong: $dest\win64\nssm.exe" -ForegroundColor Green
