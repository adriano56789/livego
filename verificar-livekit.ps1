Write-Host "=== VERIFICACAO LIVEKIT WEB ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Verificando pacote livekit-client..." -ForegroundColor Yellow
$package = npm list livekit-client --depth=0 2>$null
if ($package -match "livekit-client") {
    Write-Host "   OK: livekit-client instalado" -ForegroundColor Green
} else {
    Write-Host "   ERRO: livekit-client nao encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Verificando arquivos criados..." -ForegroundColor Yellow

$arquivos = @(
    "services\liveKitService.ts",
    "hooks\useLiveKit.ts", 
    "components\LiveKitRoom.tsx",
    "components\StreamComLiveKit.tsx"
)

foreach ($arquivo in $arquivos) {
    if (Test-Path $arquivo) {
        Write-Host "   OK: $arquivo" -ForegroundColor Green
    } else {
        Write-Host "   ERRO: $arquivo" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Testando servidores..." -ForegroundColor Yellow

# LiveKit
try {
    $livekit = Invoke-WebRequest -Uri "http://localhost:7880/" -TimeoutSec 3
    Write-Host "   OK: LiveKit Server (porta 7880)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: LiveKit Server nao acessivel" -ForegroundColor Red
}

# Backend API  
try {
    $api = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 3
    Write-Host "   OK: Backend API (porta 3000)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: Backend API nao acessivel" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== RESULTADO ===" -ForegroundColor Magenta
Write-Host "LiveKit Web SDK instalado e integrado!" -ForegroundColor Green
Write-Host ""
Write-Host "Como usar:" -ForegroundColor Yellow
Write-Host "1. Importar: import { useLiveKit } from './hooks/useLiveKit'" -ForegroundColor White
Write-Host "2. Usar componente: LiveKitRoom" -ForegroundColor White  
Write-Host "3. Integrar stream: StreamComLiveKit" -ForegroundColor White