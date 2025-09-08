# Script para gerenciar containers MongoDB e resolver conflitos
# Autor: Sistema LiveGo
# Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

param(
    [string]$Acao = "verificar",
    [switch]$Verbose
)

# Cores para output
$cores = @{
    Sucesso = "Green"
    Erro = "Red"
    Aviso = "Yellow"
    Info = "Cyan"
    Destaque = "Magenta"
}

function Write-LogColorido {
    param([string]$Mensagem, [string]$Cor = "White")
    Write-Host $Mensagem -ForegroundColor $cores[$Cor]
}

function Verificar-ContainersMongoDB {
    Write-LogColorido "🔍 Verificando containers MongoDB existentes..." "Info"
    
    try {
        # Buscar todos os containers MongoDB
        $containersMongo = docker ps -a --filter "ancestor=mongo" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.ID}}"
        
        if ($containersMongo -and $containersMongo.Count -gt 1) {
            Write-LogColorido "📦 Containers MongoDB encontrados:" "Sucesso"
            $containersMongo | ForEach-Object { 
                if ($_ -notlike "*NAMES*") {
                    Write-Host "   $_" 
                }
            }
            
            # Verificar se há containers em execução
            $containersAtivos = docker ps --filter "ancestor=mongo" --format "{{.Names}}"
            if ($containersAtivos) {
                Write-LogColorido "✅ Containers MongoDB ativos:" "Sucesso"
                $containersAtivos | ForEach-Object { Write-Host "   - $_" }
            }
            
            # Verificar se há containers parados
            $containersParados = docker ps -a --filter "ancestor=mongo" --filter "status=exited" --format "{{.Names}}"
            if ($containersParados) {
                Write-LogColorido "⏹️ Containers MongoDB parados:" "Aviso"
                $containersParados | ForEach-Object { Write-Host "   - $_" }
            }
            
        } else {
            Write-LogColorido "❌ Nenhum container MongoDB encontrado" "Erro"
        }
        
        return $true
    } catch {
        Write-LogColorido "❌ Erro ao verificar containers: $($_.Exception.Message)" "Erro"
        return $false
    }
}

function Limpar-ContainersAntigos {
    Write-LogColorido "🧹 Limpando containers MongoDB antigos..." "Info"
    
    try {
        # Parar todos os containers MongoDB
        $containersAtivos = docker ps --filter "ancestor=mongo" --format "{{.Names}}"
        if ($containersAtivos) {
            Write-LogColorido "⏹️ Parando containers ativos..." "Aviso"
            $containersAtivos | ForEach-Object {
                Write-LogColorido "   Parando: $_" "Aviso"
                docker stop $_ *>$null
            }
        }
        
        # Remover todos os containers MongoDB parados
        $containersParados = docker ps -a --filter "ancestor=mongo" --filter "status=exited" --format "{{.Names}}"
        if ($containersParados) {
            Write-LogColorido "🗑️ Removendo containers parados..." "Info"
            $containersParados | ForEach-Object {
                Write-LogColorido "   Removendo: $_" "Info"
                docker rm $_ *>$null
            }
        }
        
        Write-LogColorido "✅ Limpeza concluída!" "Sucesso"
        return $true
        
    } catch {
        Write-LogColorido "❌ Erro durante limpeza: $($_.Exception.Message)" "Erro"
        return $false
    }
}

function Iniciar-MongoDB {
    param([string]$Nome = "mongodb", [string]$Porta = "27017")
    
    Write-LogColorido "🚀 Iniciando container MongoDB..." "Info"
    
    try {
        # Verificar se já existe container com esse nome
        $containerExistente = docker ps -a --filter "name=$Nome" --format "{{.Names}}"
        
        if ($containerExistente) {
            Write-LogColorido "⚠️ Container '$Nome' já existe" "Aviso"
            
            # Verificar se está rodando
            $containerRodando = docker ps --filter "name=$Nome" --format "{{.Names}}"
            if ($containerRodando) {
                Write-LogColorido "✅ Container '$Nome' já está rodando na porta $Porta" "Sucesso"
                return $true
            } else {
                Write-LogColorido "🔄 Iniciando container existente..." "Info"
                docker start $Nome *>$null
                Start-Sleep -Seconds 3
                
                $containerAposInicio = docker ps --filter "name=$Nome" --format "{{.Names}}"
                if ($containerAposInicio) {
                    Write-LogColorido "✅ Container '$Nome' iniciado com sucesso!" "Sucesso"
                    return $true
                } else {
                    Write-LogColorido "❌ Falha ao iniciar container existente" "Erro"
                    return $false
                }
            }
        } else {
            # Criar novo container
            Write-LogColorido "📦 Criando novo container MongoDB..." "Info"
            
            $comando = "docker run -d --name $Nome -p ${Porta}:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=admin123 -e MONGO_INITDB_DATABASE=livego mongo:latest"
            
            if ($Verbose) {
                Write-LogColorido "🔧 Comando: $comando" "Info"
            }
            
            Invoke-Expression $comando *>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-LogColorido "✅ Container '$Nome' criado e iniciado com sucesso!" "Sucesso"
                Start-Sleep -Seconds 5
                return $true
            } else {
                Write-LogColorido "❌ Erro ao criar container" "Erro"
                return $false
            }
        }
        
    } catch {
        Write-LogColorido "❌ Erro ao iniciar MongoDB: $($_.Exception.Message)" "Erro"
        return $false
    }
}

function Testar-ConexaoMongoDB {
    param([string]$Porta = "27017")
    
    Write-LogColorido "🧪 Testando conexão com MongoDB..." "Info"
    
    try {
        # Verificar se a porta está acessível
        $conexao = Test-NetConnection -ComputerName "localhost" -Port $Porta -WarningAction SilentlyContinue
        
        if ($conexao.TcpTestSucceeded) {
            Write-LogColorido "✅ MongoDB está acessível na porta $Porta" "Sucesso"
            
            # Testar usando mongosh se disponível
            $mongoshDisponivel = Get-Command mongosh -ErrorAction SilentlyContinue
            if ($mongoshDisponivel) {
                Write-LogColorido "🔧 Testando com mongosh..." "Info"
                $resultado = mongosh "mongodb://admin:admin123@localhost:$Porta/livego?authSource=admin" --eval "db.adminCommand('ping')" 2>$null
                if ($resultado -match "ok.*1") {
                    Write-LogColorido "✅ Autenticação MongoDB funcionando!" "Sucesso"
                } else {
                    Write-LogColorido "⚠️ Possível problema de autenticação" "Aviso"
                }
            }
            
            return $true
        } else {
            Write-LogColorido "❌ MongoDB não está acessível na porta $Porta" "Erro"
            return $false
        }
        
    } catch {
        Write-LogColorido "❌ Erro ao testar conexão: $($_.Exception.Message)" "Erro"
        return $false
    }
}

function Mostrar-StatusCompleto {
    Write-LogColorido "📊 === STATUS COMPLETO DOS CONTAINERS ===" "Destaque"
    Write-LogColorido "📅 $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" "Info"
    Write-Host ""
    
    # Verificar containers MongoDB
    Verificar-ContainersMongoDB
    Write-Host ""
    
    # Verificar todos os containers do projeto
    Write-LogColorido "🔍 Todos os containers do projeto LiveGo:" "Info"
    $containersLiveGo = docker ps -a --filter "name=livego" --filter "name=mongodb" --filter "name=livekit" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    if ($containersLiveGo) {
        $containersLiveGo | ForEach-Object { 
            if ($_ -notlike "*NAMES*") {
                Write-Host "   $_" 
            }
        }
    }
    
    Write-Host ""
    
    # Testar conexões
    Testar-ConexaoMongoDB
}

function Executar-AcaoPrincipal {
    param([string]$Acao)
    
    Write-LogColorido "🛠️ === GERENCIADOR DE CONTAINERS MONGODB ===" "Destaque"
    Write-LogColorido "🎯 Ação solicitada: $Acao" "Info"
    Write-Host ""
    
    switch ($Acao.ToLower()) {
        "verificar" {
            Mostrar-StatusCompleto
        }
        "limpar" {
            Write-LogColorido "⚠️ Esta ação irá parar e remover todos os containers MongoDB!" "Aviso"
            $confirmacao = Read-Host "Deseja continuar? (s/N)"
            if ($confirmacao -eq 's' -or $confirmacao -eq 'S') {
                Limpar-ContainersAntigos
                Write-Host ""
                Mostrar-StatusCompleto
            } else {
                Write-LogColorido "❌ Operação cancelada pelo usuário" "Aviso"
            }
        }
        "iniciar" {
            $sucesso = Iniciar-MongoDB
            Write-Host ""
            if ($sucesso) {
                Testar-ConexaoMongoDB
            }
        }
        "reiniciar" {
            Write-LogColorido "🔄 Reiniciando serviços MongoDB..." "Info"
            Limpar-ContainersAntigos
            Write-Host ""
            $sucesso = Iniciar-MongoDB
            Write-Host ""
            if ($sucesso) {
                Testar-ConexaoMongoDB
            }
        }
        "docker-compose" {
            Write-LogColorido "🐳 Usando Docker Compose para gerenciar serviços..." "Info"
            
            # Parar containers individuais que podem conflitar
            $containersIndividuais = docker ps --filter "name=mongodb" --format "{{.Names}}"
            if ($containersIndividuais) {
                Write-LogColorido "⏹️ Parando containers MongoDB individuais..." "Aviso"
                $containersIndividuais | ForEach-Object {
                    docker stop $_ *>$null
                    docker rm $_ *>$null
                }
            }
            
            # Iniciar com docker-compose
            Write-LogColorido "🚀 Iniciando com docker-compose..." "Info"
            docker-compose up -d mongodb
            
            Start-Sleep -Seconds 5
            Testar-ConexaoMongoDB
        }
        default {
            Write-LogColorido "❌ Ação inválida: $Acao" "Erro"
            Write-LogColorido "💡 Ações disponíveis: verificar, limpar, iniciar, reiniciar, docker-compose" "Info"
        }
    }
}

# Menu interativo se nenhuma ação for especificada
if ($Acao -eq "verificar" -and $args.Count -eq 0) {
    Write-LogColorido "🔧 === MENU INTERATIVO ===" "Destaque"
    Write-Host "1. Verificar status dos containers"
    Write-Host "2. Limpar containers antigos"
    Write-Host "3. Iniciar MongoDB"
    Write-Host "4. Reiniciar tudo"
    Write-Host "5. Usar Docker Compose"
    Write-Host "0. Sair"
    Write-Host ""
    
    $opcao = Read-Host "Escolha uma opção (0-5)"
    
    switch ($opcao) {
        "1" { $Acao = "verificar" }
        "2" { $Acao = "limpar" }
        "3" { $Acao = "iniciar" }
        "4" { $Acao = "reiniciar" }
        "5" { $Acao = "docker-compose" }
        "0" { 
            Write-LogColorido "👋 Saindo..." "Info"
            exit 0 
        }
        default { 
            Write-LogColorido "❌ Opção inválida" "Erro"
            exit 1 
        }
    }
}

# Executar ação principal
try {
    Executar-AcaoPrincipal -Acao $Acao
} catch {
    Write-LogColorido "💥 Erro inesperado: $($_.Exception.Message)" "Erro"
    Write-LogColorido "📍 Linha: $($_.InvocationInfo.ScriptLineNumber)" "Erro"
}

Write-Host ""
Write-LogColorido "✨ Operação concluída!" "Destaque"