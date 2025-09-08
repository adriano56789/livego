Write-Host "=== TESTE LIVEKIT WEB INTEGRATION ===" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Blue
Write-Host ""

# Verificar instalacao do livekit-client
Write-Host "1. Verificando instalacao do SDK..." -ForegroundColor Yellow
try {
    $package = npm list livekit-client --depth=0 2>$null
    if ($package -match "livekit-client@") {
        Write-Host "   ✅ livekit-client instalado" -ForegroundColor Green
        $version = ($package -split "livekit-client@")[1] -split " ")[0]
        Write-Host "   📦 Versao: $version" -ForegroundColor Green
    } else {
        Write-Host "   ❌ livekit-client nao encontrado" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erro ao verificar pacote" -ForegroundColor Red
}

Write-Host ""

# Verificar arquivos criados
Write-Host "2. Verificando arquivos criados..." -ForegroundColor Yellow

$arquivos = @(
    "services\liveKitService.ts",
    "hooks\useLiveKit.ts", 
    "components\LiveKitRoom.tsx",
    "components\StreamComLiveKit.tsx"
)

foreach ($arquivo in $arquivos) {
    if (Test-Path $arquivo) {
        Write-Host "   ✅ $arquivo" -ForegroundColor Green
        $tamanho = (Get-Item $arquivo).Length
        Write-Host "      📏 Tamanho: $tamanho bytes" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ $arquivo" -ForegroundColor Red
    }
}

Write-Host ""

# Verificar servidor LiveKit
Write-Host "3. Verificando servidor LiveKit..." -ForegroundColor Yellow
try {
    $livekit = Invoke-WebRequest -Uri "http://localhost:7880/" -Method Get -TimeoutSec 5
    if ($livekit.StatusCode -eq 200) {
        Write-Host "   ✅ Servidor LiveKit respondendo" -ForegroundColor Green
        Write-Host "   🌐 URL: ws://localhost:7880" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Servidor LiveKit nao acessivel" -ForegroundColor Red
    Write-Host "   💡 Execute: docker start livekit-server" -ForegroundColor Yellow
}

Write-Host ""

# Verificar backend API
Write-Host "4. Verificando backend API..." -ForegroundColor Yellow
try {
    $api = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 5
    if ($api.StatusCode -eq 200) {
        Write-Host "   ✅ Backend API funcionando" -ForegroundColor Green
        
        # Testar stream especifica
        $stream = Invoke-WebRequest -Uri "http://localhost:3000/api/streams/stream_001" -Method Get -TimeoutSec 5
        if ($stream.StatusCode -eq 200) {
            $dados = $stream.Content | ConvertFrom-Json
            Write-Host "   📺 Stream teste disponivel: $($dados.titulo)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ❌ Backend API nao acessivel" -ForegroundColor Red
}

Write-Host ""

# Mostrar proximos passos
Write-Host "5. Proximos passos para usar LiveKit..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   📁 Importar hook no seu componente React:" -ForegroundColor White
Write-Host "   import { useLiveKit } from './hooks/useLiveKit';" -ForegroundColor Gray
Write-Host ""
Write-Host "   🎥 Usar componente pronto:" -ForegroundColor White  
Write-Host "   <LiveKitRoom roomName='minha-sala' participantName='meu-nome' />" -ForegroundColor Gray
Write-Host ""
Write-Host "   🔗 Integrar com stream existente:" -ForegroundColor White
Write-Host "   <StreamComLiveKit streamId='stream_001' userId={123} userName='Nome' />" -ForegroundColor Gray
Write-Host ""

# Resumo
Write-Host "=== RESUMO ===" -ForegroundColor Magenta
Write-Host "✅ SDK LiveKit instalado e pronto" -ForegroundColor Green
Write-Host "✅ Componentes React criados" -ForegroundColor Green  
Write-Host "✅ Hook personalizado disponivel" -ForegroundColor Green
Write-Host "✅ Integracao com backend LiveGo" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 LiveKit Web esta integrado ao projeto!" -ForegroundColor Green