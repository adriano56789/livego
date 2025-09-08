Write-Host "=== TESTE SISTEMA LIVEGO ===" -ForegroundColor Cyan
Write-Host ""

# Testar MongoDB
Write-Host "Testando MongoDB..." -ForegroundColor Blue
$mongodb = Test-NetConnection -ComputerName "localhost" -Port 27017 -WarningAction SilentlyContinue
if ($mongodb.TcpTestSucceeded) {
    Write-Host "MongoDB: OK" -ForegroundColor Green
} else {
    Write-Host "MongoDB: FALHOU" -ForegroundColor Red
}

# Testar Backend API
Write-Host "Testando Backend API..." -ForegroundColor Blue
try {
    $api = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 5
    if ($api.StatusCode -eq 200) {
        Write-Host "Backend API: OK" -ForegroundColor Green
    } else {
        Write-Host "Backend API: FALHOU" -ForegroundColor Red
    }
} catch {
    Write-Host "Backend API: FALHOU" -ForegroundColor Red
}

# Testar LiveKit
Write-Host "Testando LiveKit..." -ForegroundColor Blue
try {
    $livekit = Invoke-WebRequest -Uri "http://localhost:7880/" -Method Get -TimeoutSec 5
    if ($livekit.StatusCode -eq 200) {
        Write-Host "LiveKit: OK" -ForegroundColor Green
    } else {
        Write-Host "LiveKit: FALHOU" -ForegroundColor Red
    }
} catch {
    Write-Host "LiveKit: FALHOU" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== CONTAINERS ATIVOS ===" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "=== URLs DISPONIVEIS ===" -ForegroundColor Cyan
Write-Host "API Backend: http://localhost:3000"
Write-Host "LiveKit: http://localhost:7880"
Write-Host "MongoDB: mongodb://localhost:27017"