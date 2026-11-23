param(
    [ValidateRange(1, 65535)]
    [int]$Port = 3004,
    [switch]$RouterOnly
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$desktopRoot = Join-Path $projectRoot 'desktop'
$electronVite = Join-Path $desktopRoot 'node_modules\.bin\electron-vite.cmd'
$envFile = Join-Path $projectRoot '.env'

if (-not (Test-Path -LiteralPath $envFile)) {
    $parentEnvFile = Join-Path $projectRoot '..\..\.env'
    if (Test-Path -LiteralPath $parentEnvFile) {
        $envFile = (Resolve-Path -LiteralPath $parentEnvFile).Path
    }
}

if (-not (Test-Path -LiteralPath $envFile)) {
    throw 'Falta el .env con la configuracion de Auth0 en la raiz del proyecto.'
}
if (-not $RouterOnly -and -not (Test-Path -LiteralPath $electronVite)) {
    throw 'Faltan las dependencias de Electron en desktop/node_modules. Instala las dependencias del escritorio una vez antes de arrancar.'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker Desktop no esta instalado o docker no esta en PATH.'
}

function Test-DockerReady {
    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        docker info --format '{{.ServerVersion}}' *> $null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previousErrorAction
    }
}

# El mismo puerto se usa para publicar el router y para conectar Electron.
Push-Location $projectRoot
try {
    if (-not (Test-DockerReady)) {
        docker desktop start | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar Docker Desktop.' }

        $dockerReady = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            Start-Sleep -Seconds 2
            if (Test-DockerReady) {
                $dockerReady = $true
                break
            }
        }
        if (-not $dockerReady) { throw 'Docker Desktop no ha terminado de arrancar.' }
    }

    $env:ATEMPO_API_ROUTER_PORT = [string]$Port
    docker compose --env-file $envFile up -d api-router | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "No se pudo arrancar api-router en el puerto $Port." }

    $routerReady = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:$Port/health" -TimeoutSec 2
            if ($health.status -eq 'ok') {
                $routerReady = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    if (-not $routerReady) { throw "api-router no responde en http://localhost:$Port/health." }

    Write-Host "api-router listo en http://localhost:$Port"
    if ($RouterOnly) { return }

    $env:ATEMPO_API_ROUTER_URL = "http://localhost:$Port"
    Push-Location $desktopRoot
    try {
        & $electronVite dev
        if ($LASTEXITCODE -ne 0) { throw 'Electron se ha cerrado con un error.' }
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}
