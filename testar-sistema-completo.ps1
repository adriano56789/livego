# Script para testar todo o sistema LiveGo
# Versao em Português - Testa MongoDB, Backend API e LiveKit

Write-Host "=== TESTE COMPLETO DO SISTEMA LIVEGO ===" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Blue
Write-Host ""

# Funcao para testar servicos
function Testar-Servico {
    param(
        [string]$Nome,
        [string]$Url,
        [string]$Descricao
    )
    
    Write-Host "🧪 Testando $Nome..." -ForegroundColor Blue
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Nome funcionando! ($Descricao)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ $Nome retornou status $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ $Nome não acessível: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Funcao para testar MongoDB
function Testar-MongoDB {
    Write-Host "🧪 Testando MongoDB..." -ForegroundColor Blue
    
    try {
        $conexao = Test-NetConnection -ComputerName "localhost" -Port 27017 -WarningAction SilentlyContinue
        if ($conexao.TcpTestSucceeded) {
            Write-Host "✅ MongoDB acessível na porta 27017" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ MongoDB não acessível na porta 27017" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erro ao testar MongoDB: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Funcao para listar containers
function Listar-Containers {
    Write-Host "📦 Status dos containers:" -ForegroundColor Yellow
    Write-Host ""
    
    # Containers do projeto
    $containers = @("mongodb", "livego-api", "livekit-server")
    
    foreach ($container in $containers) {
        $status = docker ps --filter "name=$container" --format "{{.Names}}: {{.Status}}" 2>$null
        if ($status) {
            Write-Host "✅ $status" -ForegroundColor Green
        } else {
            $statusParado = docker ps -a --filter "name=$container" --format "{{.Names}}: {{.Status}}" 2>$null
            if ($statusParado) {
                Write-Host "⏹️ $statusParado" -ForegroundColor Yellow
            } else {
                Write-Host "❌ $container: Não encontrado" -ForegroundColor Red
            }
        }
    }
    Write-Host ""
}

# Executar testes
Write-Host "🔍 Verificando containers..." -ForegroundColor Blue
Listar-Containers

Write-Host "🧪 Executando testes de conectividade..." -ForegroundColor Blue
Write-Host ""

# Testar servicos
$resultados = @{}
$resultados.MongoDB = Testar-MongoDB
$resultados.BackendAPI = Testar-Servico -Nome "Backend API" -Url "http://localhost:3000/api/health" -Descricao "API REST funcionando"
$resultados.LiveKit = Testar-Servico -Nome "LiveKit Server" -Url "http://localhost:7880/" -Descricao "Servidor WebRTC funcionando"

Write-Host ""
Write-Host "📊 === RESUMO DOS TESTES ===" -ForegroundColor Magenta

foreach ($teste in $resultados.GetEnumerator()) {
    $status = if ($teste.Value) { "✅ OK" } else { "❌ FALHOU" }
    $cor = if ($teste.Value) { "Green" } else { "Red" }
    Write-Host "$($teste.Key): $status" -ForegroundColor $cor
}

Write-Host ""

# Verificar se todos passaram
$todosOK = ($resultados.Values | Where-Object { $_ -eq $false }).Count -eq 0

if ($todosOK) {
    Write-Host "🎉 TODOS OS SERVIÇOS FUNCIONANDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📖 URLs disponíveis:" -ForegroundColor Cyan
    Write-Host "• API Backend: http://localhost:3000" -ForegroundColor White
    Write-Host "• API Health: http://localhost:3000/api/health" -ForegroundColor White
    Write-Host "• LiveKit WebRTC: ws://localhost:7880" -ForegroundColor White
    Write-Host "• MongoDB: mongodb://admin:admin123@localhost:27017/livego" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Sistema pronto para uso!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Alguns serviços falharam. Sugestões:" -ForegroundColor Yellow
    Write-Host "1. Execute: docker-compose -f docker-compose-basic.yml up -d" -ForegroundColor White
    Write-Host "2. Para LiveKit: docker start livekit-server" -ForegroundColor White
    Write-Host "3. Execute este teste novamente" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Teste concluído!" -ForegroundColor Cyan