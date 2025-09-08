# Script para iniciar todos os serviços do LiveGo
# Executa verificações e inicia todos os containers Docker

param(
    [switch]$Rebuild,
    [switch]$Logs,
    [string]$Profile = "completo"
)

Write-Host "=== Iniciando Serviços do LiveGo ===" -ForegroundColor Cyan

# Função para logging com cores
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCESSO] $Message" -ForegroundColor Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "[AVISO] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

# Verificar se o Docker está rodando
function Test-Docker {
    Write-LogInfo "Verificando se o Docker está rodando..."
    
    try {
        docker info *>$null
        Write-LogSuccess "Docker está funcionando"
        return $true
    }
    catch {
        Write-LogError "Docker não está rodando! Por favor, inicie o Docker Desktop."
        return $false
    }
}

# Parar serviços existentes
function Stop-ExistingServices {
    Write-LogInfo "Parando serviços existentes..."
    
    try {
        docker compose down *>$null
        docker compose -f docker-compose-basic.yml down *>$null
        docker compose -f docker-compose-simple.yml down *>$null
        Write-LogSuccess "Serviços existentes parados"
    }
    catch {
        Write-LogWarning "Nenhum serviço estava rodando ou erro ao parar"
    }
}

# Escolher arquivo de configuração baseado no perfil
function Get-ComposeFile {
    param([string]$Profile)
    
    switch ($Profile.ToLower()) {
        "basico" { 
            Write-LogInfo "Usando perfil básico (MongoDB + Backend API)"
            return "docker-compose-basic.yml" 
        }
        "simples" { 
            Write-LogInfo "Usando perfil simples (MongoDB + Backend API + LiveKit)"
            return "docker-compose-simple.yml" 
        }
        "completo" { 
            Write-LogInfo "Usando perfil completo (todos os serviços)"
            return "docker-compose.yml" 
        }
        default { 
            Write-LogWarning "Perfil desconhecido '$Profile', usando básico"
            return "docker-compose-basic.yml" 
        }
    }
}

# Construir imagens se necessário
function Build-Images {
    param([string]$ComposeFile, [bool]$Rebuild)
    
    if ($Rebuild) {
        Write-LogInfo "Reconstruindo imagens Docker..."
        try {
            docker compose -f $ComposeFile build --no-cache
            if ($LASTEXITCODE -eq 0) {
                Write-LogSuccess "Imagens reconstruídas com sucesso"
            } else {
                Write-LogError "Falha ao reconstruir imagens"
                return $false
            }
        }
        catch {
            Write-LogError "Erro ao reconstruir imagens: $_"
            return $false
        }
    } else {
        Write-LogInfo "Construindo imagens se necessário..."
        try {
            docker compose -f $ComposeFile build
            Write-LogSuccess "Imagens preparadas"
        }
        catch {
            Write-LogWarning "Possível erro ao construir imagens: $_"
        }
    }
    return $true
}

# Iniciar serviços
function Start-Services {
    param([string]$ComposeFile)
    
    Write-LogInfo "Iniciando serviços com $ComposeFile..."
    
    try {
        docker compose -f $ComposeFile up -d
        if ($LASTEXITCODE -eq 0) {
            Write-LogSuccess "Serviços iniciados com sucesso!"
            return $true
        } else {
            Write-LogError "Falha ao iniciar serviços"
            return $false
        }
    }
    catch {
        Write-LogError "Erro ao iniciar serviços: $_"
        return $false
    }
}

# Verificar status dos serviços
function Check-ServicesStatus {
    param([string]$ComposeFile)
    
    Write-LogInfo "Verificando status dos serviços..."
    Start-Sleep -Seconds 5
    
    try {
        Write-Host ""
        Write-Host "=== Status dos Serviços ===" -ForegroundColor Yellow
        docker compose -f $ComposeFile ps
        Write-Host ""
        
        # Verificar health dos serviços principais
        $healthyServices = 0
        $totalServices = 0
        
        $services = docker compose -f $ComposeFile ps --format json | ConvertFrom-Json
        
        foreach ($service in $services) {
            $totalServices++
            if ($service.Health -eq "healthy" -or $service.State -eq "running") {
                $healthyServices++
            }
        }
        
        if ($healthyServices -eq $totalServices) {
            Write-LogSuccess "Todos os serviços estão funcionando ($healthyServices/$totalServices)"
        } else {
            Write-LogWarning "$healthyServices de $totalServices serviços estão funcionando"
        }
        
    }
    catch {
        Write-LogWarning "Erro ao verificar status: $_"
    }
}

# Mostrar URLs disponíveis
function Show-ServiceUrls {
    param([string]$Profile)
    
    Write-Host ""
    Write-Host "=== URLs dos Serviços ===" -ForegroundColor Green
    Write-Host "• API Backend: http://localhost:3000" -ForegroundColor White
    Write-Host "• API Health Check: http://localhost:3000/api/health" -ForegroundColor White
    Write-Host "• MongoDB: mongodb://localhost:27017" -ForegroundColor White
    Write-Host "• WebSocket: ws://localhost:3000" -ForegroundColor White
    
    if ($Profile -ne "basico") {
        Write-Host "• LiveKit: ws://localhost:7880" -ForegroundColor White
    }
    
    if ($Profile -eq "completo") {
        Write-Host "• SRS RTMP: rtmp://localhost:1935" -ForegroundColor White
        Write-Host "• SRS HTTP API: http://localhost:1985" -ForegroundColor White
        Write-Host "• SRS HLS: http://localhost:8080" -ForegroundColor White
    }
    Write-Host ""
}

# Mostrar logs se solicitado
function Show-Logs {
    param([string]$ComposeFile)
    
    Write-LogInfo "Mostrando logs dos serviços..."
    Write-Host "Pressione Ctrl+C para parar de visualizar os logs" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    try {
        docker compose -f $ComposeFile logs -f
    }
    catch {
        Write-LogInfo "Logs interrompidos pelo usuário"
    }
}

# Função principal
function Main {
    Write-LogInfo "Iniciando script de inicialização dos serviços do LiveGo..."
    
    # Verificar Docker
    if (-not (Test-Docker)) {
        exit 1
    }
    
    # Parar serviços existentes
    Stop-ExistingServices
    
    # Obter arquivo de configuração
    $composeFile = Get-ComposeFile -Profile $Profile
    
    # Verificar se o arquivo existe
    if (-not (Test-Path $composeFile)) {
        Write-LogError "Arquivo de configuração '$composeFile' não encontrado!"
        exit 1
    }
    
    # Construir imagens
    if (-not (Build-Images -ComposeFile $composeFile -Rebuild $Rebuild)) {
        exit 1
    }
    
    # Iniciar serviços
    if (-not (Start-Services -ComposeFile $composeFile)) {
        Write-LogError "Falha ao iniciar serviços. Verificando logs..."
        docker compose -f $composeFile logs --tail=20
        exit 1
    }
    
    # Verificar status
    Check-ServicesStatus -ComposeFile $composeFile
    
    # Mostrar URLs
    Show-ServiceUrls -Profile $Profile
    
    # Comandos úteis
    Write-Host "=== Comandos Úteis ===" -ForegroundColor Cyan
    Write-Host "• Parar serviços: docker compose -f $composeFile down" -ForegroundColor White
    Write-Host "• Ver logs: docker compose -f $composeFile logs -f" -ForegroundColor White
    Write-Host "• Ver status: docker compose -f $composeFile ps" -ForegroundColor White
    Write-Host "• Reiniciar: .\iniciar-servicos.ps1 -Rebuild -Profile $Profile" -ForegroundColor White
    Write-Host ""
    
    # Mostrar logs se solicitado
    if ($Logs) {
        Show-Logs -ComposeFile $composeFile
    }
    
    Write-LogSuccess "=== Inicialização Completa! ==="
}

# Executar função principal
try {
    Main
}
catch {
    Write-LogError "Erro durante a execução: $_"
    exit 1
}