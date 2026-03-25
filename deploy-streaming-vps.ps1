# PowerShell Script para deploy completo do streaming na VPS
# Versão melhorada com validações e tratamento de erros

[CmdletBinding()]
param()

# Função para verificar se comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Função para verificar se porta está em uso
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

Write-Host "🚀 DEPLOY STREAMING VPS - LIVEGO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Verificar pré-requisitos
Write-Host "🔍 Verificando pré-requisitos..." -ForegroundColor Yellow

if (-not (Test-Command "docker")) {
    Write-Host "❌ Docker não encontrado. Instale Docker primeiro." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js não encontrado. Instale Node.js primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pré-requisitos OK" -ForegroundColor Green

# 2. Parar serviços existentes
Write-Host "🛑 Parando serviços existentes..." -ForegroundColor Yellow

# Parar containers Docker
docker ps -q --filter "name=srs" | ForEach-Object { docker stop $_ }
docker ps -q --filter "name=coturn" | ForEach-Object { docker stop $_ }

# Remover containers existentes
docker ps -aq --filter "name=srs" | ForEach-Object { docker rm $_ }
docker ps -aq --filter "name=coturn" | ForEach-Object { docker rm $_ }

# Parar processos Node
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ Serviços parados" -ForegroundColor Green

# 3. Verificar arquivos de configuração
Write-Host "📁 Verificando arquivos de configuração..." -ForegroundColor Yellow

$configFiles = @(
    "srs.conf",
    "turnserver.conf",
    ".env"
)

foreach ($file in $configFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Arquivo $file não encontrado" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Arquivos de configuração OK" -ForegroundColor Green

# 4. Configurar variáveis de ambiente
Write-Host "🌍 Configurando ambiente VPS..." -ForegroundColor Yellow

$envContent = @"
VITE_API_BASE_URL=https://livego.store
VITE_WS_URL=wss://livego.store
VITE_USE_MOCK=false
VITE_SRS_API_URL=https://livego.store:1985
VITE_SRS_WEBRTC_URL=wss://livego.store:8000/live
VITE_SRS_RTMP_URL=rtmp://livego.store:1935/live
VITE_SRS_HTTP_URL=https://livego.store:8080/live
VITE_SRS_HLS_URL=https://livego.store:8000/live
VITE_STUN_SERVER_URL=stun:livego.store:3478
VITE_TURN_SERVER_URL=turn:livego.store:3478
VITE_TURN_USERNAME=livego
VITE_TURN_CREDENTIAL=livego123secret
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
Write-Host "✅ Variáveis de ambiente configuradas" -ForegroundColor Green

# 5. Corrigir URLs de WebRTC
Write-Host "🔧 Corrigindo URLs WebRTC..." -ForegroundColor Yellow

$directories = @("services", "components", "backend")
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Get-ChildItem -Path $dir -Filter "*.ts" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            (Get-Content $_.FullName) -replace 'webrtc://', 'wss://' | Set-Content $_.FullName
        }
        Get-ChildItem -Path $dir -Filter "*.tsx" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            (Get-Content $_.FullName) -replace 'webrtc://', 'wss://' | Set-Content $_.FullName
        }
    }
}

Write-Host "✅ URLs WebRTC corrigidas" -ForegroundColor Green

# 6. Iniciar SRS
Write-Host "📡 Iniciando SRS..." -ForegroundColor Yellow

try {
    $currentPath = Get-Location
    
    docker run -d --name srs `
        -p 1935:1935 `
        -p 8080:8080 `
        -p 1985:1985 `
        -p 8000:8000 `
        -v "${currentPath}/srs.conf:/usr/local/srs/conf/srs.conf" `
        --restart unless-stopped `
        ossrs/srs:5
    
    # Verificar se container está rodando
    Start-Sleep -Seconds 5
    $srsContainer = docker ps -q --filter "name=srs"
    
    if (-not $srsContainer) {
        throw "Container SRS não iniciou"
    }
    
    Write-Host "✅ SRS iniciado com sucesso" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro ao iniciar SRS: $_" -ForegroundColor Red
    exit 1
}

# 7. Iniciar TURN Server
Write-Host "🔄 Iniciando TURN Server..." -ForegroundColor Yellow

try {
    $currentPath = Get-Location
    
    docker run -d --name coturn `
        -p 3478:3478 `
        -p 3478:3478/udp `
        -p 5349:5349 `
        -v "${currentPath}/turnserver.conf:/etc/coturn/turnserver.conf" `
        --restart unless-stopped `
        coturn/coturn
    
    # Verificar se container está rodando
    Start-Sleep -Seconds 3
    $turnContainer = docker ps -q --filter "name=coturn"
    
    if (-not $turnContainer) {
        throw "Container TURN não iniciou"
    }
    
    Write-Host "✅ TURN Server iniciado com sucesso" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro ao iniciar TURN Server: $_" -ForegroundColor Red
    exit 1
}

# 8. Instalar dependências do backend
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow

try {
    Set-Location backend
    
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro ao instalar dependências: $_" -ForegroundColor Red
    exit 1
}

# 9. Iniciar Backend
Write-Host "🖥️ Iniciando Backend..." -ForegroundColor Yellow

try {
    Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
    
    # Aguardar backend iniciar
    Start-Sleep -Seconds 10
    
    # Verificar se backend está respondendo
    $backendRunning = Test-Port -Port 3000
    
    if (-not $backendRunning) {
        Write-Host "⚠️ Backend pode não estar respondendo na porta 3000" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Backend iniciado" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro ao iniciar backend: $_" -ForegroundColor Red
    exit 1
}

# 10. Verificar portas
Write-Host "🔍 Verificando portas..." -ForegroundColor Yellow

$ports = @{
    1935 = "SRS RTMP"
    1985 = "SRS API"
    8000 = "SRS WebRTC"
    8080 = "SRS HTTP"
    3478 = "TURN Server"
    3000 = "Backend API"
}

foreach ($port in $ports.GetEnumerator()) {
    $isOpen = Test-Port -Port $port.Key
    $status = if ($isOpen) { "✅ ABERTA" } else { "❌ FECHADA" }
    Write-Host "   Porta $($port.Key) ($($port.Value)): $status" -ForegroundColor $(if ($isOpen) { "Green" } else { "Red" })
}

# 11. Resumo final
Write-Host ""
Write-Host "🎉 DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Cyan
Write-Host "📋 Serviços ativos:" -ForegroundColor White
Write-Host "   - SRS: https://livego.store:1985" -ForegroundColor Gray
Write-Host "   - TURN: livego.store:3478" -ForegroundColor Gray
Write-Host "   - Backend: https://livego.store" -ForegroundColor Gray
Write-Host "   - Frontend: https://livego.store" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 URLs de teste:" -ForegroundColor White
Write-Host "   - SRS API: https://livego.store:1985/api/v1/summaries" -ForegroundColor Gray
Write-Host "   - Backend: https://livego.store/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Verifique firewall se portas estiverem fechadas" -ForegroundColor Gray
Write-Host "   - Configure SSL certificado para HTTPS" -ForegroundColor Gray
Write-Host "   - Monitore logs dos containers Docker" -ForegroundColor Gray

Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "✅ Script concluído com sucesso!" -ForegroundColor Green
