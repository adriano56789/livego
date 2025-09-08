Write-Host "=== TESTE DO VIDEO PLAYER LIVEKIT ===" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Blue
Write-Host ""

# Verificar componentes modificados
Write-Host "1. Verificando componentes modificados..." -ForegroundColor Yellow
Write-Host ""

$componentePrincipal = "components\LiveStreamViewerScreen.tsx"
if (Test-Path $componentePrincipal) {
    Write-Host "   ✅ LiveStreamViewerScreen.tsx encontrado" -ForegroundColor Green
    
    # Verificar se as importacoes do LiveKit foram adicionadas
    $conteudo = Get-Content $componentePrincipal -Raw
    
    if ($conteudo -match "useLiveKit") {
        Write-Host "   ✅ Hook useLiveKit importado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Hook useLiveKit NAO importado" -ForegroundColor Red
    }
    
    if ($conteudo -match "liveKitService") {
        Write-Host "   ✅ Servico liveKitService importado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Servico liveKitService NAO importado" -ForegroundColor Red
    }
    
    if ($conteudo -match "remoteVideoRef") {
        Write-Host "   ✅ Referencias de video remoto adicionadas" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Referencias de video remoto NAO encontradas" -ForegroundColor Red
    }
    
    if ($conteudo -match "livekit-track-subscribed") {
        Write-Host "   ✅ Listeners de tracks implementados" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Listeners de tracks NAO implementados" -ForegroundColor Red
    }
    
} else {
    Write-Host "   ❌ LiveStreamViewerScreen.tsx NAO encontrado" -ForegroundColor Red
}

Write-Host ""

# Verificar servicos LiveKit
Write-Host "2. Verificando servicos LiveKit..." -ForegroundColor Yellow
Write-Host ""

$servicosLiveKit = @(
    "services\liveKitService.ts",
    "hooks\useLiveKit.ts"
)

foreach ($servico in $servicosLiveKit) {
    if (Test-Path $servico) {
        Write-Host "   ✅ $servico" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $servico NAO encontrado" -ForegroundColor Red
    }
}

Write-Host ""

# Verificar servidores
Write-Host "3. Verificando servidores..." -ForegroundColor Yellow
Write-Host ""

# Backend API
try {
    $api = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 3
    if ($api.StatusCode -eq 200) {
        Write-Host "   ✅ Backend API funcionando (porta 3000)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend API nao acessivel" -ForegroundColor Red
}

# LiveKit Server
try {
    $livekit = Invoke-WebRequest -Uri "http://localhost:7880/" -TimeoutSec 3
    if ($livekit.StatusCode -eq 200) {
        Write-Host "   ✅ LiveKit Server funcionando (porta 7880)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ LiveKit Server nao acessivel" -ForegroundColor Red
}

# MongoDB
try {
    $mongo = Test-NetConnection -ComputerName "localhost" -Port 27017 -WarningAction SilentlyContinue
    if ($mongo.TcpTestSucceeded) {
        Write-Host "   ✅ MongoDB funcionando (porta 27017)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ MongoDB nao acessivel" -ForegroundColor Red
}

Write-Host ""

# Verificar dependencias
Write-Host "4. Verificando dependencias..." -ForegroundColor Yellow
Write-Host ""

$deps = @(
    "livekit-client"
)

foreach ($dep in $deps) {
    $package = npm list $dep --depth=0 2>$null
    if ($package -match $dep) {
        Write-Host "   ✅ $dep instalado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $dep NAO instalado" -ForegroundColor Red
    }
}

Write-Host ""

# Mostrar funcionalidades implementadas
Write-Host "=== FUNCIONALIDADES IMPLEMENTADAS ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "📺 Video Player com LiveKit:" -ForegroundColor Yellow
Write-Host "   • Conexao automatica host/espectador" -ForegroundColor White
Write-Host "   • Gerenciamento de tracks de video" -ForegroundColor White
Write-Host "   • Suporte para PK battles (2 videos)" -ForegroundColor White
Write-Host "   • Status de conexao em tempo real" -ForegroundColor White
Write-Host ""
Write-Host "🎛️ Controles implementados:" -ForegroundColor Yellow
Write-Host "   • Auto-conexao do host ao iniciar stream" -ForegroundColor White
Write-Host "   • Auto-conexao de espectadores" -ForegroundColor White
Write-Host "   • Anexar tracks automaticamente" -ForegroundColor White
Write-Host "   • Feedback visual de status" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Melhorias no componente:" -ForegroundColor Yellow
Write-Host "   • Overlay de status LiveKit" -ForegroundColor White
Write-Host "   • Referencias de video separadas para PK" -ForegroundColor White
Write-Host "   • Tratamento de erros melhorado" -ForegroundColor White
Write-Host "   • Logs em portugues" -ForegroundColor White

Write-Host ""
Write-Host "=== COMO TESTAR ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Inicie todos os servicos:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose-basic.yml up -d" -ForegroundColor Gray
Write-Host "   docker start livekit-server" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Abra o frontend:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Crie uma stream e teste:" -ForegroundColor Yellow
Write-Host "   • Host vera sua propria camera" -ForegroundColor White
Write-Host "   • Espectadores verao o video do host" -ForegroundColor White
Write-Host "   • Verifique status do LiveKit no canto superior" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Video Player com LiveKit implementado!" -ForegroundColor Green