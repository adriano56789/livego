# Script para testar configuração do LiveKit
# Autor: Sistema LiveGo
# Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

param(
    [string]$Hostname = "localhost",
    [int]$Port = 7880,
    [switch]$Verbose
)

# Configurações
$livekitUrl = "http://${Hostname}:${Port}"
$apiKey = "devkey"
$apiSecret = "secret"

# Cores para output
$cores = @{
    Sucesso = "Green"
    Erro = "Red"
    Aviso = "Yellow"
    Info = "Cyan"
    Destaque = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Cor = "White")
    Write-Host $Message -ForegroundColor $cores[$Cor]
}

function Teste-ConectividadeRede {
    param([string]$Hostname, [int]$Port)
    
    Write-ColorOutput "🌐 Testando conectividade de rede..." "Info"
    
    try {
        $conexao = Test-NetConnection -ComputerName $Hostname -Port $Port -WarningAction SilentlyContinue
        if ($conexao.TcpTestSucceeded) {
            Write-ColorOutput "✅ Porta $Port está acessível em $Hostname" "Sucesso"
            return $true
        } else {
            Write-ColorOutput "❌ Porta $Port não está acessível em $Hostname" "Erro"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Erro na verificação de rede: $($_.Exception.Message)" "Erro"
        return $false
    }
}

function Teste-ServidorLiveKit {
    param([string]$Url)
    
    Write-ColorOutput "🏥 Verificando saúde do servidor LiveKit..." "Info"
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10 -ErrorAction Stop
        Write-ColorOutput "✅ Servidor LiveKit esta respondendo!" "Sucesso"
        
        if ($Verbose) {
            Write-ColorOutput "📊 Detalhes da resposta:" "Info"
            Write-Host $response
        }
        
        return $true
    } catch {
        Write-ColorOutput "❌ Servidor LiveKit nao esta respondendo: $($_.Exception.Message)" "Erro"
        Write-ColorOutput "💡 Sugestões:" "Aviso"
        Write-ColorOutput "   - Verifique se o container está rodando: docker ps | findstr livekit" "Aviso"
        Write-ColorOutput "   - Inicie os serviços: docker-compose up -d" "Aviso"
        Write-ColorOutput "   - Verifique os logs: docker logs livekit" "Aviso"
        return $false
    }
}

function Teste-ContainerDocker {
    Write-ColorOutput "🐳 Verificando status do container LiveKit..." "Info"
    
    try {
        $container = docker ps --filter "name=livekit" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>$null
        
        if ($container -and $container.Count -gt 1) {
            Write-ColorOutput "✅ Container LiveKit está rodando:" "Sucesso"
            $container | ForEach-Object { Write-Host "   $_" }
            return $true
        } else {
            Write-ColorOutput "❌ Container LiveKit não encontrado ou não está rodando" "Erro"
            Write-ColorOutput "💡 Iniciando container..." "Info"
            
            # Tentar iniciar o container
            docker-compose up -d livekit 2>$null
            Start-Sleep -Seconds 5
            
            $containerAposInicio = docker ps --filter "name=livekit" --format "{{.Names}}" 2>$null
            if ($containerAposInicio) {
                Write-ColorOutput "✅ Container iniciado com sucesso!" "Sucesso"
                return $true
            } else {
                Write-ColorOutput "❌ Falha ao iniciar container" "Erro"
                return $false
            }
        }
    } catch {
        Write-ColorOutput "❌ Erro ao verificar Docker: $($_.Exception.Message)" "Erro"
        Write-ColorOutput "💡 Certifique-se de que o Docker está instalado e rodando" "Aviso"
        return $false
    }
}

function Teste-ConfiguracaoLiveKit {
    Write-ColorOutput "⚙️ Verificando arquivo de configuração..." "Info"
    
    $configPath = ".\livekit.yaml"
    
    if (Test-Path $configPath) {
        Write-ColorOutput "✅ Arquivo livekit.yaml encontrado" "Sucesso"
        
        try {
            $config = Get-Content $configPath -Raw
            
            if ($config -match "keys:") {
                Write-ColorOutput "✅ Seção de chaves encontrada" "Sucesso"
            } else {
                Write-ColorOutput "⚠️ Seção de chaves não encontrada" "Aviso"
            }
            
            if ($config -match "port:\s*7880") {
                Write-ColorOutput "✅ Porta configurada corretamente (7880)" "Sucesso"
            } else {
                Write-ColorOutput "⚠️ Porta pode não estar configurada corretamente" "Aviso"
            }
            
            if ($Verbose) {
                Write-ColorOutput "📄 Conteúdo da configuração:" "Info"
                Write-Host $config
            }
            
            return $true
        } catch {
            Write-ColorOutput "❌ Erro ao ler configuração: $($_.Exception.Message)" "Erro"
            return $false
        }
    } else {
        Write-ColorOutput "❌ Arquivo livekit.yaml não encontrado" "Erro"
        Write-ColorOutput "💡 Certifique-se de executar o script na pasta raiz do projeto" "Aviso"
        return $false
    }
}

function Teste-VariaveisAmbiente {
    Write-ColorOutput "🔧 Verificando variáveis de ambiente..." "Info"
    
    $variaveis = @{
        "LIVEKIT_API_KEY" = $apiKey
        "LIVEKIT_API_SECRET" = $apiSecret
        "LIVEKIT_WS_URL" = "ws://livekit:7880"
    }
    
    $dockerComposeContent = Get-Content ".\docker-compose.yml" -Raw -ErrorAction SilentlyContinue
    
    if ($dockerComposeContent) {
        $todasEncontradas = $true
        
        foreach ($var in $variaveis.GetEnumerator()) {
            if ($dockerComposeContent -match "$($var.Key)") {
                Write-ColorOutput "✅ $($var.Key) configurada" "Sucesso"
            } else {
                Write-ColorOutput "❌ $($var.Key) não encontrada" "Erro"
                $todasEncontradas = $false
            }
        }
        
        return $todasEncontradas
    } else {
        Write-ColorOutput "❌ docker-compose.yml não encontrado" "Erro"
        return $false
    }
}

function Executar-TestesCompletos {
    Write-ColorOutput "🧪 === TESTE COMPLETO DO LIVEKIT ===" "Destaque"
    Write-ColorOutput "📅 $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" "Info"
    Write-ColorOutput "🌐 Testando: $livekitUrl" "Info"
    Write-Host ""
    
    $resultados = @{}
    
    # Teste 1: Configuração
    $resultados.Config = Teste-ConfiguracaoLiveKit
    Write-Host ""
    
    # Teste 2: Variáveis de ambiente
    $resultados.Variaveis = Teste-VariaveisAmbiente
    Write-Host ""
    
    # Teste 3: Container Docker
    $resultados.Docker = Teste-ContainerDocker
    Write-Host ""
    
    # Teste 4: Conectividade de rede
    $resultados.Rede = Teste-ConectividadeRede -Hostname $Hostname -Port $Port
    Write-Host ""
    
    # Teste 5: Servidor
    $resultados.Servidor = Teste-ServidorLiveKit -Url $livekitUrl
    Write-Host ""
    
    # Resumo
    Write-ColorOutput "📊 === RESUMO DOS TESTES ===" "Destaque"
    foreach ($teste in $resultados.GetEnumerator()) {
        $status = if ($teste.Value) { "✅ OK" } else { "❌ FALHOU" }
        $cor = if ($teste.Value) { "Sucesso" } else { "Erro" }
        Write-ColorOutput "$($teste.Key): $status" $cor
    }
    
    Write-Host ""
    
    $todosPassaram = ($resultados.Values | Where-Object { $_ -eq $false }).Count -eq 0
    
    if ($todosPassaram) {
        Write-ColorOutput "🎉 Todos os testes passaram! LiveKit está funcionando corretamente." "Sucesso"
        Write-ColorOutput "📖 URLs úteis:" "Info"
        Write-ColorOutput "   - Servidor: $livekitUrl/" "Info"
        Write-ColorOutput "   - WebSocket: ws://${Hostname}:${Port}/" "Info"
        Write-ColorOutput "   - API Backend: http://localhost:3000/api/" "Info"
    } else {
        Write-ColorOutput "⚠️ Alguns testes falharam. Verifique as configurações acima." "Aviso"
        Write-ColorOutput "🔧 Para resolver problemas:" "Info"
        Write-ColorOutput "   1. Execute: docker-compose up -d" "Info"
        Write-ColorOutput "   2. Aguarde alguns segundos para inicialização" "Info"
        Write-ColorOutput "   3. Execute este script novamente" "Info"
    }
}

# Executar testes
try {
    Executar-TestesCompletos
} catch {
    Write-ColorOutput "💥 Erro inesperado: $($_.Exception.Message)" "Erro"
    Write-ColorOutput "📍 Linha: $($_.InvocationInfo.ScriptLineNumber)" "Erro"
}

Write-Host ""
Write-ColorOutput "✨ Teste concluido!" "Destaque"