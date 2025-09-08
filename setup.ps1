# Script de configuracao do LiveGo para Windows PowerShell
# Executa verificacoes e configura o ambiente

param(
    [switch]$SkipPortCheck,
    [switch]$Verbose
)

Write-Host "=== Configuracao do Ambiente LiveGo ===" -ForegroundColor Cyan

# Funcao para logging com cores
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar se o Docker esta instalado e funcionando
function Test-Docker {
    Write-LogInfo "Verificando Docker..."
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-LogError "Docker nao esta instalado!"
        exit 1
    }
    
    try {
        docker info *>$null
        Write-LogSuccess "Docker esta funcionando corretamente"
    }
    catch {
        Write-LogError "Docker nao esta rodando!"
        exit 1
    }
}

# Verificar se o Docker Compose esta disponivel
function Test-DockerCompose {
    Write-LogInfo "Verificando Docker Compose..."
    
    $composeAvailable = $false
    
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $composeAvailable = $true
    }
    elseif (docker compose version *>$null) {
        $composeAvailable = $true
    }
    
    if ($composeAvailable) {
        Write-LogSuccess "Docker Compose esta disponivel"
    }
    else {
        Write-LogError "Docker Compose nao esta disponivel!"
        exit 1
    }
}

# Verificar arquivos de configuracao necessarios
function Test-ConfigFiles {
    Write-LogInfo "Verificando arquivos de configuracao..."
    
    $requiredFiles = @(
        "docker-compose.yml",
        "srs.conf",
        "livekit.yaml",
        "api-server\Dockerfile",
        "api-server\package.json",
        "api-server\index.js",
        "api-server\startup.sh"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-LogError "Arquivo necessario nao encontrado: $file"
            exit 1
        }
    }
    
    Write-LogSuccess "Todos os arquivos de configuracao estao presentes"
}

# Verificar portas disponiveis
function Test-Ports {
    if ($SkipPortCheck) {
        Write-LogWarning "Verificacao de portas foi pulada"
        return
    }
    
    Write-LogInfo "Verificando portas necessarias..."
    
    $ports = @(1935, 1985, 8080, 8000, 7880, 7881, 3000, 27017)
    $occupiedPorts = @()
    
    foreach ($port in $ports) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connections) {
                $occupiedPorts += $port
            }
        }
        catch {
            # Porta nao esta em uso ou erro ao verificar
        }
    }
    
    if ($occupiedPorts.Count -gt 0) {
        Write-LogWarning "As seguintes portas ja estao em uso: $($occupiedPorts -join ', ')"
        Write-LogWarning "Isso pode causar conflitos. Considere parar outros servicos."
    }
    else {
        Write-LogSuccess "Todas as portas necessarias estao disponiveis"
    }
}

# Criar diretorios necessarios
function New-RequiredDirectories {
    Write-LogInfo "Criando diretorios necessarios..."
    
    $directories = @(
        "mongodb_data",
        "srs_data",
        "logs"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-LogInfo "Diretorio criado: $dir"
        }
    }
    
    Write-LogSuccess "Diretorios criados/verificados"
}

# Verificar conectividade de rede
function Test-Network {
    Write-LogInfo "Verificando configuracao de rede..."
    
    try {
        # Remover rede existente se houver
        docker network rm livego-network *>$null
    }
    catch {
        # Rede nao existe
    }
    
    try {
        # Criar rede customizada
        docker network create --driver bridge --subnet=172.20.0.0/16 --gateway=172.20.0.1 livego-network *>$null
        Write-LogSuccess "Rede livego-network criada"
    }
    catch {
        Write-LogWarning "Rede livego-network ja existe ou falha ao criar"
    }
}

# Construir imagens Docker
function Build-Images {
    Write-LogInfo "Construindo imagens Docker..."
    
    try {
        docker compose build --no-cache
        if ($LASTEXITCODE -eq 0) {
            Write-LogSuccess "Imagens construidas com sucesso"
        }
        else {
            Write-LogError "Falha ao construir imagens"
            exit 1
        }
    }
    catch {
        Write-LogError "Falha ao construir imagens: $_"
        exit 1
    }
}

# Funcao principal
function Main {
    Write-LogInfo "Iniciando verificacao e configuracao do ambiente..."
    
    Test-Docker
    Test-DockerCompose
    Test-ConfigFiles
    Test-Ports
    New-RequiredDirectories
    Test-Network
    Build-Images
    
    Write-Host ""
    Write-LogSuccess "=== Configuracao completa! ==="
    Write-Host ""
    Write-LogInfo "Para iniciar os servicos, execute:"
    Write-Host "  docker compose up -d" -ForegroundColor White
    Write-Host ""
    Write-LogInfo "Para verificar o status dos servicos:"
    Write-Host "  docker compose ps" -ForegroundColor White
    Write-Host ""
    Write-LogInfo "Para visualizar logs:"
    Write-Host "  docker compose logs -f" -ForegroundColor White
    Write-Host ""
    Write-LogInfo "URLs dos servicos:"
    Write-Host "  - API Backend: http://localhost:3000" -ForegroundColor White
    Write-Host "  - SRS HTTP API: http://localhost:1985" -ForegroundColor White
    Write-Host "  - SRS HLS/HTTP: http://localhost:8080" -ForegroundColor White
    Write-Host "  - LiveKit: ws://localhost:7880" -ForegroundColor White
    Write-Host "  - MongoDB: mongodb://localhost:27017" -ForegroundColor White
}

# Executar funcao principal
try {
    Main
}
catch {
    Write-LogError "Erro durante a execucao: $_"
    exit 1
}