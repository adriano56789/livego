Write-Host "=== TESTE API BANCO DE DADOS LIVEGO ===" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:3000"
$testes = @()

Write-Host "Testando endpoints da API..." -ForegroundColor Blue
Write-Host ""

# Teste 1: Health Check
try {
    $health = Invoke-WebRequest -Uri "$apiUrl/api/health" -Method Get -TimeoutSec 5
    if ($health.StatusCode -eq 200) {
        Write-Host "Health Check: OK" -ForegroundColor Green
        $testes += "Health: OK"
    }
} catch {
    Write-Host "Health Check: ERRO" -ForegroundColor Red
    $testes += "Health: ERRO"
}

# Teste 2: Listar Streams
try {
    $streams = Invoke-WebRequest -Uri "$apiUrl/api/streams" -Method Get -TimeoutSec 5
    if ($streams.StatusCode -eq 200) {
        $dados = $streams.Content | ConvertFrom-Json
        Write-Host "Listar Streams: OK ($($dados.Count) streams)" -ForegroundColor Green
        $testes += "Streams: OK"
    }
} catch {
    Write-Host "Listar Streams: ERRO" -ForegroundColor Red
    $testes += "Streams: ERRO"
}

# Teste 3: Buscar Usuario
try {
    $user = Invoke-WebRequest -Uri "$apiUrl/api/users/10755083" -Method Get -TimeoutSec 5
    if ($user.StatusCode -eq 200) {
        $dadosUser = $user.Content | ConvertFrom-Json
        Write-Host "Buscar Usuario: OK (Nome: $($dadosUser.name))" -ForegroundColor Green
        $testes += "Usuario: OK"
    }
} catch {
    Write-Host "Buscar Usuario: ERRO" -ForegroundColor Red
    $testes += "Usuario: ERRO"
}

# Teste 4: Listar Presentes
try {
    $gifts = Invoke-WebRequest -Uri "$apiUrl/api/gifts" -Method Get -TimeoutSec 5
    if ($gifts.StatusCode -eq 200) {
        $dadosGifts = $gifts.Content | ConvertFrom-Json
        Write-Host "Listar Presentes: OK ($($dadosGifts.Count) presentes)" -ForegroundColor Green
        $testes += "Presentes: OK"
    }
} catch {
    Write-Host "Listar Presentes: ERRO" -ForegroundColor Red
    $testes += "Presentes: ERRO"
}

# Teste 5: Chat da Stream
try {
    $chat = Invoke-WebRequest -Uri "$apiUrl/api/streams/stream_001/chat" -Method Get -TimeoutSec 5
    if ($chat.StatusCode -eq 200) {
        $dadosChat = $chat.Content | ConvertFrom-Json
        Write-Host "Chat da Stream: OK ($($dadosChat.Count) mensagens)" -ForegroundColor Green
        $testes += "Chat: OK"
    }
} catch {
    Write-Host "Chat da Stream: ERRO" -ForegroundColor Red
    $testes += "Chat: ERRO"
}

Write-Host ""
Write-Host "=== RESUMO ===" -ForegroundColor Yellow
$sucessos = ($testes | Where-Object { $_ -like "*OK*" }).Count
$total = $testes.Count
Write-Host "Sucessos: $sucessos de $total testes" -ForegroundColor Green

Write-Host ""
Write-Host "=== COMUNICACAO ===" -ForegroundColor Cyan
Write-Host "Frontend (React) -> apiClient.ts -> Backend (Express) -> MongoDB" -ForegroundColor White
Write-Host "WebSocket: Frontend <-> websocketClient.ts <-> Backend (Socket.IO)" -ForegroundColor White

Write-Host ""
Write-Host "=== ENDPOINTS DISPONIVEIS ===" -ForegroundColor Cyan
Write-Host "GET  /api/health              - Status da API" -ForegroundColor White
Write-Host "GET  /api/version             - Versao da API" -ForegroundColor White
Write-Host "GET  /api/users/:id           - Buscar usuario" -ForegroundColor White
Write-Host "GET  /api/streams             - Listar streams" -ForegroundColor White
Write-Host "POST /api/streams             - Criar stream" -ForegroundColor White
Write-Host "GET  /api/gifts               - Listar presentes" -ForegroundColor White
Write-Host "GET  /api/streams/:id/chat    - Chat da stream" -ForegroundColor White
Write-Host "POST /api/streams/:id/chat    - Enviar mensagem" -ForegroundColor White

Write-Host ""
if ($sucessos -eq $total) {
    Write-Host "A API do banco esta funcionando perfeitamente!" -ForegroundColor Green
} else {
    Write-Host "Alguns testes falharam. Verificar configuracao." -ForegroundColor Yellow
}