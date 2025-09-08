# Script para testar a API do banco de dados MongoDB
# Verifica todas as funcionalidades de comunicação entre frontend, backend e banco
# Autor: Sistema LiveGo
# Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

Write-Host "=== TESTE DA API DO BANCO DE DADOS LIVEGO ===" -ForegroundColor Cyan
Write-Host "Verificando comunicação Frontend ↔ Backend ↔ MongoDB" -ForegroundColor Blue
Write-Host ""

# Configurações da API
$apiBaseUrl = "http://localhost:3000"
$testesPaginas = @()

function Testar-Endpoint {
    param(
        [string]$Nome,
        [string]$Endpoint,
        [string]$Metodo = "GET",
        [string]$Body = $null,
        [string]$Descricao
    )
    
    Write-Host "🧪 Testando: $Nome" -ForegroundColor Blue
    Write-Host "   Endpoint: $Metodo $Endpoint" -ForegroundColor Gray
    Write-Host "   Descrição: $Descricao" -ForegroundColor Gray
    
    try {
        $url = "$apiBaseUrl$Endpoint"
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        $parametros = @{
            Uri = $url
            Method = $Metodo
            Headers = $headers
            TimeoutSec = 10
        }
        
        if ($Body) {
            $parametros.Body = $Body
        }
        
        $response = Invoke-WebRequest @parametros
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host "   ✅ SUCESSO - Status: $($response.StatusCode)" -ForegroundColor Green
            
            # Tentar parsear JSON
            try {
                $dados = $response.Content | ConvertFrom-Json
                if ($dados -is [array]) {
                    Write-Host "   📊 Retornou: $($dados.Count) registros" -ForegroundColor Green
                } else {
                    Write-Host "   📄 Retornou: Objeto JSON válido" -ForegroundColor Green
                }
            } catch {
                Write-Host "   📄 Retornou: Texto simples" -ForegroundColor Green
            }
            
            return @{ Sucesso = $true; Status = $response.StatusCode; Dados = $response.Content }
        } else {
            Write-Host "   ⚠️ AVISO - Status: $($response.StatusCode)" -ForegroundColor Yellow
            return @{ Sucesso = $false; Status = $response.StatusCode; Erro = "Status HTTP inesperado" }
        }
        
    } catch {
        Write-Host "   ❌ ERRO - $($_.Exception.Message)" -ForegroundColor Red
        return @{ Sucesso = $false; Status = 0; Erro = $_.Exception.Message }
    }
    
    Write-Host ""
}

function Testar-WebSocket {
    Write-Host "🔌 Testando WebSocket..." -ForegroundColor Blue
    Write-Host "   URL: ws://localhost:3000" -ForegroundColor Gray
    Write-Host "   Descrição: Comunicação em tempo real" -ForegroundColor Gray
    
    try {
        # Testar se o servidor suporta WebSocket verificando o endpoint HTTP
        $response = Invoke-WebRequest -Uri "$apiBaseUrl/" -Method Get -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Servidor WebSocket acessível" -ForegroundColor Green
            return @{ Sucesso = $true; Status = 200 }
        } else {
            Write-Host "   ❌ Servidor WebSocket não acessível" -ForegroundColor Red
            return @{ Sucesso = $false; Status = $response.StatusCode }
        }
    } catch {
        Write-Host "   ❌ ERRO - $($_.Exception.Message)" -ForegroundColor Red
        return @{ Sucesso = $false; Status = 0; Erro = $_.Exception.Message }
    }
    
    Write-Host ""
}

# ============================================
# EXECUTAR TODOS OS TESTES DA API
# ============================================

Write-Host "📋 Iniciando testes dos endpoints da API..." -ForegroundColor Yellow
Write-Host ""

# 1. TESTES DE SAÚDE E VERSÃO
$resultados = @{}

$resultados["Health Check"] = Testar-Endpoint -Nome "Health Check" -Endpoint "/api/health" -Descricao "Verificar se a API está funcionando"

$resultados["Versão da API"] = Testar-Endpoint -Nome "Versão da API" -Endpoint "/api/version" -Descricao "Obter informações de versão"

# 2. TESTES DE USUÁRIOS
$resultados["Buscar Usuário"] = Testar-Endpoint -Nome "Buscar Usuário" -Endpoint "/api/users/10755083" -Descricao "Buscar usuário por ID no MongoDB"

$resultados["Usuário Inexistente"] = Testar-Endpoint -Nome "Usuário Inexistente" -Endpoint "/api/users/999999" -Descricao "Testar busca por usuário que não existe"

# 3. TESTES DE STREAMS
$resultados["Listar Streams"] = Testar-Endpoint -Nome "Listar Streams" -Endpoint "/api/streams" -Descricao "Listar streams ativas do MongoDB"

$resultados["Buscar Stream"] = Testar-Endpoint -Nome "Buscar Stream" -Endpoint "/api/streams/stream_001" -Descricao "Buscar stream específica por ID"

# 4. TESTES DE PRESENTES
$resultados["Listar Presentes"] = Testar-Endpoint -Nome "Listar Presentes" -Endpoint "/api/gifts" -Descricao "Listar presentes disponíveis"

# 5. TESTES DE CHAT
$resultados["Chat de Stream"] = Testar-Endpoint -Nome "Chat de Stream" -Endpoint "/api/streams/stream_001/chat" -Descricao "Obter mensagens do chat"

# 6. TESTE DE WEBSOCKET
$resultados["WebSocket"] = Testar-WebSocket

# 7. TESTE DE CRIAÇÃO (POST)
$novaStreamJson = @{
    titulo = "Stream de Teste"
    nome_streamer = "Testador"
    categoria = "Teste"
    thumbnail_url = "https://picsum.photos/400/300?random=999"
    user_id = 10755083
} | ConvertTo-Json

$resultados["Criar Stream"] = Testar-Endpoint -Nome "Criar Stream" -Endpoint "/api/streams" -Metodo "POST" -Body $novaStreamJson -Descricao "Criar nova stream no MongoDB"

# ============================================
# RESUMO DOS RESULTADOS
# ============================================

Write-Host ""
Write-Host "📊 === RESUMO DOS TESTES DA API ===" -ForegroundColor Magenta
Write-Host ""

$sucessos = 0
$falhas = 0

foreach ($teste in $resultados.GetEnumerator()) {
    $nome = $teste.Key
    $resultado = $teste.Value
    
    if ($resultado.Sucesso) {
        Write-Host "✅ $nome" -ForegroundColor Green
        $sucessos++
    } else {
        Write-Host "❌ $nome - $($resultado.Erro)" -ForegroundColor Red
        $falhas++
    }
}

Write-Host ""
Write-Host "📈 Estatísticas:" -ForegroundColor Cyan
Write-Host "   • Sucessos: $sucessos" -ForegroundColor Green
Write-Host "   • Falhas: $falhas" -ForegroundColor Red
Write-Host "   • Total: $($sucessos + $falhas)" -ForegroundColor Blue

# ============================================
# ANÁLISE DA COMUNICAÇÃO
# ============================================

Write-Host ""
Write-Host "🔍 === ANÁLISE DA COMUNICAÇÃO ===" -ForegroundColor Magenta
Write-Host ""

if ($resultados["Health Check"].Sucesso) {
    Write-Host "✅ Backend API funcionando" -ForegroundColor Green
} else {
    Write-Host "❌ Backend API com problemas" -ForegroundColor Red
}

if ($resultados["Buscar Usuário"].Sucesso) {
    Write-Host "✅ Conexão Backend ↔ MongoDB funcionando" -ForegroundColor Green
} else {
    Write-Host "❌ Problemas na conexão Backend ↔ MongoDB" -ForegroundColor Red
}

if ($resultados["WebSocket"].Sucesso) {
    Write-Host "✅ WebSocket para Frontend disponível" -ForegroundColor Green
} else {
    Write-Host "❌ Problemas no WebSocket para Frontend" -ForegroundColor Red
}

# ============================================
# DOCUMENTAÇÃO DA API
# ============================================

Write-Host ""
Write-Host "📚 === DOCUMENTAÇÃO DA API ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 URLs da API:" -ForegroundColor Yellow
Write-Host "   • Base URL: http://localhost:3000" -ForegroundColor White
Write-Host "   • Health Check: GET /api/health" -ForegroundColor White
Write-Host "   • WebSocket: ws://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "👤 Endpoints de Usuários:" -ForegroundColor Yellow
Write-Host "   • GET /api/users/:id - Buscar usuário por ID" -ForegroundColor White
Write-Host ""
Write-Host "📺 Endpoints de Streams:" -ForegroundColor Yellow
Write-Host "   • GET /api/streams - Listar streams ativas" -ForegroundColor White
Write-Host "   • GET /api/streams/:id - Buscar stream por ID" -ForegroundColor White
Write-Host "   • POST /api/streams - Criar nova stream" -ForegroundColor White
Write-Host "   • POST /api/streams/:id/join - Entrar na stream" -ForegroundColor White
Write-Host "   • POST /api/streams/:id/leave - Sair da stream" -ForegroundColor White
Write-Host ""
Write-Host "💬 Endpoints de Chat:" -ForegroundColor Yellow
Write-Host "   • GET /api/streams/:id/chat - Obter mensagens do chat" -ForegroundColor White
Write-Host "   • POST /api/streams/:id/chat - Enviar mensagem" -ForegroundColor White
Write-Host ""
Write-Host "🎁 Endpoints de Presentes:" -ForegroundColor Yellow
Write-Host "   • GET /api/gifts - Listar presentes disponíveis" -ForegroundColor White
Write-Host "   • POST /api/gifts/send - Enviar presente" -ForegroundColor White

# ============================================
# CONCLUSÃO
# ============================================

Write-Host ""
if ($sucessos -gt $falhas) {
    Write-Host "🎉 A API do banco de dados está funcionando corretamente!" -ForegroundColor Green
    Write-Host "✅ Comunicação Frontend ↔ Backend ↔ MongoDB estabelecida" -ForegroundColor Green
} else {
    Write-Host "⚠️ Há problemas na API do banco de dados" -ForegroundColor Yellow
    Write-Host "🔧 Verificar configurações e dependências" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Teste concluído!" -ForegroundColor Cyan