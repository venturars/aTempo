# Arranca el binario de RustFS instalado en el ordenador (camino ZIP).
# No usa Docker. Carga rustfs/.env si existe.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$EnvFile = Join-Path $Root ".env"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $parts = $line.Split("=", 2)
    if ($parts.Count -ne 2) { return }
    Set-Item -Path "Env:$($parts[0].Trim())" -Value $parts[1].Trim()
  }
}

$Bin = if ($env:RUSTFS_BIN) { $env:RUSTFS_BIN } else { "C:\rustfs\bin\rustfs.exe" }
$Data = if ($env:RUSTFS_DATA) { $env:RUSTFS_DATA } else { (Join-Path $Root "data") }
$Address = if ($env:RUSTFS_ADDRESS) { $env:RUSTFS_ADDRESS } else { "127.0.0.1:9000" }
$ConsoleAddress = if ($env:RUSTFS_CONSOLE_ADDRESS) { $env:RUSTFS_CONSOLE_ADDRESS } else { "127.0.0.1:9001" }
$AccessKey = if ($env:RUSTFS_ACCESS_KEY) { $env:RUSTFS_ACCESS_KEY } else { "atempo" }
$SecretKey = if ($env:RUSTFS_SECRET_KEY) { $env:RUSTFS_SECRET_KEY } else { "atempoatempo" }

if (-not (Test-Path $Bin)) {
  Write-Error "No encuentro el binario en: $Bin. Instálalo con el ZIP (ver README) o define RUSTFS_BIN en .env"
}

New-Item -ItemType Directory -Force -Path $Data | Out-Null

$env:RUSTFS_ACCESS_KEY = $AccessKey
$env:RUSTFS_SECRET_KEY = $SecretKey

Write-Host "RustFS API:     http://$Address"
Write-Host "RustFS consola: http://$ConsoleAddress"
Write-Host "Datos:          $Data"
Write-Host "Para parar: Ctrl+C"
Write-Host ""

& $Bin server `
  --address $Address `
  --console-enable `
  --console-address $ConsoleAddress `
  $Data
