# PicoClaw health check / light recovery
# Run from workspace: powershell -ExecutionPolicy Bypass -File scripts/pico-health.ps1 [-CleanupBrowserMcp] [-KillPort3000Duplicates]
param(
  [switch]$CleanupBrowserMcp,
  [switch]$KillPort3000Duplicates
)

$ErrorActionPreference = 'SilentlyContinue'

function Section($name) { Write-Host "`n=== $name ===" -ForegroundColor Cyan }
function MB($bytes) { [math]::Round($bytes / 1MB, 1) }

Section 'System'
$os = Get-CimInstance Win32_OperatingSystem
$drive = Get-PSDrive C
[pscustomobject]@{
  FreeMemGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
  TotalMemGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
  FreeDiskGB = [math]::Round($drive.Free / 1GB, 2)
} | Format-List

Section 'Picoclaw processes'
Get-Process picoclaw -ErrorAction SilentlyContinue |
  Select-Object Name,Id,Path,@{n='MB';e={MB $_.WorkingSet64}},StartTime |
  Format-Table -AutoSize

Section 'Gateway port 18790'
$gw = Get-NetTCPConnection -LocalPort 18790 -State Listen -ErrorAction SilentlyContinue
if ($gw) {
  $gw | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize
  foreach ($p in ($gw.OwningProcess | Sort-Object -Unique)) {
    Get-Process -Id $p -ErrorAction SilentlyContinue | Select-Object Name,Id,Path,@{n='MB';e={MB $_.WorkingSet64}} | Format-Table -AutoSize
  }
} else {
  Write-Warning 'Gateway port 18790 not listening. If chat UI hangs, restart launcher/gateway.'
}

Section 'Port 3000'
$p3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($p3000) {
  $p3000 | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize
  $owners = $p3000.OwningProcess | Sort-Object -Unique
  foreach ($p in $owners) {
    Get-Process -Id $p -ErrorAction SilentlyContinue | Select-Object Name,Id,Path,@{n='MB';e={MB $_.WorkingSet64}},StartTime | Format-Table -AutoSize
  }
  if ($KillPort3000Duplicates -and $owners.Count -gt 1) {
    $keep = $owners[0]
    $owners | Select-Object -Skip 1 | ForEach-Object {
      Write-Warning "Killing duplicate port 3000 owner PID $_ (keeping $keep)"
      Stop-Process -Id $_ -Force
    }
  }
} else {
  Write-Host 'Port 3000 free.'
}

Section 'Heavy processes'
Get-Process | Sort-Object WorkingSet64 -Descending |
  Select-Object -First 12 Name,Id,@{n='MB';e={MB $_.WorkingSet64}},CPU |
  Format-Table -AutoSize

Section 'Recent gateway errors'
$gatewayLog = Join-Path $env:USERPROFILE '.picoclaw\logs\gateway.log'
$launcherLog = Join-Path $env:USERPROFILE '.picoclaw\logs\launcher.log'
foreach ($log in @($gatewayLog, $launcherLog)) {
  if (Test-Path $log) {
    Write-Host "--- $log"
    Get-Content $log -Tail 40 | Select-String -Pattern 'error|warn|exited|refuse|WebSocket|stale|18790'
  }
}

Section 'Browser MCP cleanup'
if ($CleanupBrowserMcp) {
  $oldChrome = Get-Process chrome -ErrorAction SilentlyContinue |
    Where-Object { $_.StartTime -lt (Get-Date).AddHours(-4) -and $_.WorkingSet64 -lt 250MB }
  if ($oldChrome) {
    $oldChrome | Select-Object Name,Id,@{n='MB';e={MB $_.WorkingSet64}},StartTime | Format-Table -AutoSize
    Write-Warning 'Killing old small Chrome processes. Main user Chrome may also be affected if old.'
    $oldChrome | Stop-Process -Force
  } else {
    Write-Host 'No old small Chrome processes matched.'
  }
} else {
  Write-Host 'Skipped. Use -CleanupBrowserMcp to cleanup old small Chrome processes.'
}

Section 'Done'
