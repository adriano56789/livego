# Script para gerenciar containers MongoDB
# Versão simplificada para resolver conflitos

param(
    [string]$Acao = "verificar"
)

Write-Host "=== GERENCIADOR DE CONTAINERS MONGODB ===" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Blue
Write-Host ""

function Verificar-Containers {
    Write-Host "🔍 Verificando containers MongoDB..." -ForegroundColor Blue
    
    # Listar todos os containers MongoDB
    Write-Host ""
    Write-Host "📦 Containers MongoDB (todos):" -ForegroundColor Yellow
    docker ps -a --filter "ancestor=mongo" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Host ""
    Write-Host "✅ Containers MongoDB ativos:" -ForegroundColor Green
    docker ps --filter "ancestor=mongo" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Host ""
    Write-Host "⏹️ Containers MongoDB parados:" -ForegroundColor Yellow
    docker ps -a --filter "ancestor=mongo" --filter "status=exited" --format "table {{.Names}}\t{{.Status}}"
}

function Limpar-Containers {
    Write-Host "🧹 Limpando containers MongoDB antigos..." -ForegroundColor Yellow
    
    # Parar todos os containers MongoDB
    $containersAtivos = docker ps --filter "ancestor=mongo" --format "{{.Names}}"
    if ($containersAtivos) {
        Write-Host "⏹️ Parando containers ativos..." -ForegroundColor Yellow
        foreach ($container in $containersAtivos) {
            Write-Host "   Parando: $container" -ForegroundColor White
            docker stop $container | Out-Null
        }
    }
    
    # Remover containers parados
    $containersParados = docker ps -a --filter "ancestor=mongo" --filter "status=exited" --format "{{.Names}}"
    if ($containersParados) {
        Write-Host "🗑️ Removendo containers parados..." -ForegroundColor Yellow
        foreach ($container in $containersParados) {
            Write-Host "   Removendo: $container" -ForegroundColor White
            docker rm $container | Out-Null
        }
    }
    
    Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
}

function Iniciar-MongoDB {
    Write-Host "🚀 Iniciando MongoDB com Docker Compose..." -ForegroundColor Blue
    
    # Usar docker-compose para iniciar
    Write-Host "📋 Iniciando serviços básicos..." -ForegroundColor Blue
    docker-compose -f docker-compose-basic.yml up -d
    
    # Aguardar inicialização
    Write-Host "⏳ Aguardando inicialização..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verificar status
    Write-Host "📊 Status dos serviços:" -ForegroundColor Blue
    docker-compose -f docker-compose-basic.yml ps
}

function Testar-Conexao {
    Write-Host "🧪 Testando conexão MongoDB..." -ForegroundColor Blue
    
    # Testar conectividade da porta
    try {
        $conexao = Test-NetConnection -ComputerName "localhost" -Port 27017 -WarningAction SilentlyContinue
        if ($conexao.TcpTestSucceeded) {
            Write-Host "✅ MongoDB está acessível na porta 27017" -ForegroundColor Green
        } else {
            Write-Host "❌ MongoDB não está acessível na porta 27017" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erro ao testar conexão: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Mostrar-Menu {
    Write-Host "🔧 === MENU DE OPÇÕES ===" -ForegroundColor Cyan
    Write-Host "1. Verificar status dos containers"
    Write-Host "2. Limpar containers antigos"
    Write-Host "3. Iniciar MongoDB (Docker Compose)"
    Write-Host "4. Testar conexão"
    Write-Host "5. Fazer tudo (limpar + iniciar + testar)"
    Write-Host "0. Sair"
    Write-Host ""
}

# Executar ação baseada no parâmetro
switch ($Acao.ToLower()) {
    "verificar" {
        if ($args.Count -eq 0) {
            # Modo interativo
            do {
                Mostrar-Menu
                $opcao = Read-Host "Escolha uma opção (0-5)"
                Write-Host ""
                
                switch ($opcao) {
                    "1" { Verificar-Containers }
                    "2" { Limpar-Containers }
                    "3" { Iniciar-MongoDB }
                    "4" { Testar-Conexao }
                    "5" { 
                        Limpar-Containers
                        Write-Host ""
                        Iniciar-MongoDB
                        Write-Host ""
                        Testar-Conexao
                    }
                    "0" { 
                        Write-Host "👋 Saindo..." -ForegroundColor Blue
                        exit 0 
                    }
                    default { 
                        Write-Host "❌ Opção inválida" -ForegroundColor Red
                    }
                }
                Write-Host ""
                Write-Host "Pressione Enter para continuar..." -ForegroundColor Gray
                Read-Host
                Clear-Host
            } while ($true)
        } else {
            Verificar-Containers
        }
    }
    "limpar" { Limpar-Containers }
    "iniciar" { Iniciar-MongoDB }
    "testar" { Testar-Conexao }
    "tudo" { 
        Limpar-Containers
        Write-Host ""
        Iniciar-MongoDB
        Write-Host ""
        Testar-Conexao
    }
    default {
        Write-Host "❌ Ação inválida: $Acao" -ForegroundColor Red
        Write-Host "💡 Ações disponíveis: verificar, limpar, iniciar, testar, tudo" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✨ Operação concluída!" -ForegroundColor Green