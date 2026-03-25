# PowerShell Script para corrigir streaming na VPS

Write-Host "🔧 CORREÇÃO COMPLETA DO STREAMING - VPS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Parar todos os serviços
Write-Host "🛑 Parando serviços..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*srs*"} | Stop-Process -Force

# 2. Configurar variáveis de ambiente para VPS
Write-Host "🌍 Configurando ambiente VPS..." -ForegroundColor Yellow
$envContent = @"
VITE_API_BASE_URL=https://livego.store
VITE_WS_URL=wss://livego.store
VITE_USE_MOCK=false
VITE_SRS_API_URL=https://livego.store:1985
VITE_SRS_WEBRTC_URL=wss://livego.store:8000/live
VITE_SRS_RTMP_URL=rtmp://livego.store:1935/live
VITE_SRS_HTTP_URL=https://livego.store:8080/live
VITE_SRS_HLS_URL=https://livego.store:8000/live
VITE_STUN_SERVER_URL=stun:livego.store:3478
VITE_TURN_SERVER_URL=turn:livego.store:3478
VITE_TURN_USERNAME=livego
VITE_TURN_CREDENTIAL=livego123secret
"@
$envContent | Out-File -FilePath ".env" -Encoding UTF8

# 3. Corrigir URLs de WebRTC (remover webrtc://)
Write-Host "🔧 Corrigindo URLs WebRTC..." -ForegroundColor Yellow
Get-ChildItem -Path "services" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName) -replace 'webrtc://', 'wss://' | Set-Content $_.FullName
}
Get-ChildItem -Path "components" -Filter "*.tsx" -Recurse | ForEach-Object {
    (Get-Content $_.FullName) -replace 'webrtc://', 'wss://' | Set-Content $_.FullName
}
Get-ChildItem -Path "backend" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName) -replace 'webrtc://', 'wss://' | Set-Content $_.FullName
}

# 4. Iniciar SRS via Docker
Write-Host "📡 Iniciando SRS..." -ForegroundColor Yellow
docker run -d --name srs `
  -p 1935:1935 `
  -p 8080:8080 `
  -p 1985:1985 `
  -p 8000:8000 `
  -v "$(Get-Location)/srs.conf:/usr/local/srs/conf/srs.conf" `
  ossrs/srs:5

# 5. Iniciar TURN Server via Docker
Write-Host "🔄 Iniciando TURN Server..." -ForegroundColor Yellow
docker run -d --name coturn `
  -p 3478:3478 `
  -p 3478:3478/udp `
  -p 5349:5349 `
  -v "$(Get-Location)/turnserver.conf:/etc/coturn/turnserver.conf" `
  coturn/coturn

# 6. Iniciar Backend
Write-Host "🖥️ Iniciando Backend..." -ForegroundColor Yellow
Set-Location backend
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden

Write-Host "✅ Sistema de streaming corrigido!" -ForegroundColor Green
Write-Host "📋 Serviços ativos:" -ForegroundColor Cyan
Write-Host "   - SRS: https://livego.store:1985" -ForegroundColor White
Write-Host "   - TURN: livego.store:3478" -ForegroundColor White
Write-Host "   - Backend: https://livego.store" -ForegroundColor White
Write-Host "   - Frontend: https://livego.store" -ForegroundColor White
