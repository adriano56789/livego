# Script para testar conexão com MongoDB do LiveGo
# Suporta tanto conexão local quanto via Docker

param(
    [switch]$Docker,
    [string]$Uri = "mongodb://admin:admin123@localhost:27017/livego?authSource=admin",
    [switch]$Verbose
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    TESTE DE CONEXÃO COM MONGODB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para logging
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCESSO] $Message" -ForegroundColor Green
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "[AVISO] $Message" -ForegroundColor Yellow
}

# Testar se MongoDB está rodando via Docker
function Test-MongoDBDocker {
    Write-LogInfo "Verificando se MongoDB está rodando via Docker..."
    
    try {
        $containers = docker ps --filter "name=mongodb" --format "{{.Names}}"
        if ($containers -match "mongodb") {
            Write-LogSuccess "Container MongoDB está rodando"
            return $true
        } else {
            Write-LogWarning "Container MongoDB não encontrado"
            return $false
        }
    }
    catch {
        Write-LogError "Erro ao verificar containers Docker: $_"
        return $false
    }
}

# Testar conectividade de rede
function Test-NetworkConnectivity {
    param([string]$Hostname = "localhost", [int]$Port = 27017)
    
    Write-LogInfo "Testando conectividade de rede para ${Hostname}:${Port}..."
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $result = $tcpClient.BeginConnect($Hostname, $Port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne(3000)
        
        if ($success) {
            $tcpClient.EndConnect($result)
            $tcpClient.Close()
            Write-LogSuccess "Porta $Port está acessível"
            return $true
        } else {
            Write-LogError "Timeout ao conectar na porta $Port"
            return $false
        }
    }
    catch {
        Write-LogError "Erro de conectividade: $_"
        return $false
    }
}

# Executar teste via Node.js
function Invoke-NodeTest {
    param([string]$MongoUri)
    
    Write-LogInfo "Executando teste via Node.js..."
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-LogSuccess "Node.js encontrado: $nodeVersion"
    }
    catch {
        Write-LogError "Node.js não encontrado"
        return $false
    }
    
    # Instalar dependências se necessário
    if (-not (Test-Path "node_modules\mongodb")) {
        Write-LogInfo "Instalando dependência mongodb..."
        npm install mongodb
        if ($LASTEXITCODE -ne 0) {
            Write-LogError "Falha ao instalar dependências"
            return $false
        }
    }
    
    # Executar teste
    $env:MONGO_URI = $MongoUri
    node testar-mongodb.js
    
    return $LASTEXITCODE -eq 0
}

# Executar teste via Docker
function Invoke-DockerTest {
    param([string]$MongoUri)
    
    Write-LogInfo "Executando teste via Docker..."
    
    try {
        # Verificar se existe rede do LiveGo
        $networks = docker network ls --filter "name=livego" --format "{{.Name}}"
        if ($networks) {
            $networkFlag = "--network $($networks | Select-Object -First 1)"
        } else {
            $networkFlag = ""
        }
        
        $dockerCmd = "docker run --rm $networkFlag -v `"$($PWD):/app`" -w /app -e MONGO_URI=`"$MongoUri`" node:18-alpine sh -c `"npm install mongodb && node testar-mongodb.js`""
        
        if ($Verbose) {
            Write-LogInfo "Comando Docker: $dockerCmd"
        }
        
        Invoke-Expression $dockerCmd
        
        return $LASTEXITCODE -eq 0
    }
    catch {
        Write-LogError "Erro ao executar teste via Docker: $_"
        return $false
    }
}

# Verificar status dos serviços
function Get-ServiceStatus {
    Write-LogInfo "Verificando status dos serviços..."
    
    Write-Host ""
    Write-Host "=== STATUS DOS CONTAINERS ===" -ForegroundColor Yellow
    try {
        docker ps --filter "name=mongodb" --filter "name=livego-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    }
    catch {
        Write-LogWarning "Não foi possível verificar status dos containers"
    }
    
    Write-Host ""
}

# Função principal
function Main {
    Write-LogInfo "Iniciando teste de conexão com MongoDB..."
    Write-LogInfo "URI de conexão: $Uri"
    
    # Verificar status dos serviços
    Get-ServiceStatus
    
    # Verificar se MongoDB está rodando
    $mongoRunning = Test-MongoDBDocker
    
    if (-not $mongoRunning) {
        Write-LogWarning "MongoDB não está rodando via Docker"
        Write-LogInfo "Sugestão: Execute 'docker compose -f docker-compose-basic.yml up -d'"
        
        $startServices = Read-Host "Deseja iniciar os serviços automaticamente? (s/N)"
        if ($startServices -eq 's' -or $startServices -eq 'S') {
            Write-LogInfo "Iniciando serviços..."
            docker compose -f docker-compose-basic.yml up -d
            Start-Sleep -Seconds 10
        }
    }
    
    # Testar conectividade de rede
    if ($Uri -match "localhost|127\.0\.0\.1") {
        Test-NetworkConnectivity -Hostname "localhost" -Port 27017
    }
    
    # Executar teste
    $testSuccess = $false
    
    if ($Docker) {
        Write-LogInfo "Modo Docker forçado"
        $testSuccess = Invoke-DockerTest -MongoUri $Uri
    } else {
        # Tentar Node.js local primeiro
        $testSuccess = Invoke-NodeTest -MongoUri $Uri
        
        if (-not $testSuccess) {
            Write-LogWarning "Teste local falhou, tentando via Docker..."
            $testSuccess = Invoke-DockerTest -MongoUri $Uri
        }
    }
    
    Write-Host ""
    if ($testSuccess) {
        Write-LogSuccess "=== TESTE CONCLUÍDO COM SUCESSO! ==="
    } else {
        Write-LogError "=== TESTE FALHOU! ==="
        Write-Host ""
        Write-Host "💡 Sugestões para resolver:" -ForegroundColor Yellow
        Write-Host "1. Verificar se Docker está rodando" -ForegroundColor White
        Write-Host "2. Executar: docker compose -f docker-compose-basic.yml up -d" -ForegroundColor White
        Write-Host "3. Aguardar alguns segundos para inicialização" -ForegroundColor White
        Write-Host "4. Executar este script novamente" -ForegroundColor White
        exit 1
    }
}

# Executar
try {
    Main
}
catch {
    Write-LogError "Erro durante execução: $_"
    exit 1
}