# Script de inicialização SRS - Ambiente Local
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando SRS em ambiente LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verificar se o executável existe
if (-Not (Test-Path "./srs.exe")) {
    Write-Host "ERRO: srs.exe não encontrado no diretório atual!" -ForegroundColor Red
    Write-Host "Certifique-se de que o SRS está instalado corretamente." -ForegroundColor Yellow
    exit 1
}

# Verificar configuração
if (-Not (Test-Path "./srs.local.conf")) {
    Write-Host "ERRO: srs.local.conf não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "Configuração: srs.local.conf" -ForegroundColor Green
Write-Host "Painel: http://localhost:8080" -ForegroundColor Yellow
Write-Host "API: http://localhost:1985" -ForegroundColor Yellow
Write-Host "WebRTC: webrtc://127.0.0.1:8000/live" -ForegroundColor Yellow
Write-Host "RTMP: rtmp://127.0.0.1:1935/live" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

# Iniciar SRS
Write-Host "Iniciando servidor SRS..." -ForegroundColor Green
try {
    ./srs.exe -c srs.local.conf
} catch {
    Write-Host "ERRO ao iniciar SRS: $_" -ForegroundColor Red
    exit 1
}
