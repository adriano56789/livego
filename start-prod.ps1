# Script de inicialização SRS - Ambiente Produção
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando SRS em ambiente PRODUÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verificar se o executável existe
if (-Not (Test-Path "./srs.exe")) {
    Write-Host "ERRO: srs.exe não encontrado no diretório atual!" -ForegroundColor Red
    Write-Host "Certifique-se de que o SRS está instalado corretamente." -ForegroundColor Yellow
    exit 1
}

# Verificar configuração
if (-Not (Test-Path "./srs.prod.conf")) {
    Write-Host "ERRO: srs.prod.conf não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "Configuração: srs.prod.conf" -ForegroundColor Green
Write-Host "IP Público: 72.60.249.175" -ForegroundColor Yellow
Write-Host "Painel: http://72.60.249.175:8080" -ForegroundColor Yellow
Write-Host "API: http://72.60.249.175:1985" -ForegroundColor Yellow
Write-Host "WebRTC: webrtc://72.60.249.175:8000/live" -ForegroundColor Yellow
Write-Host "RTMP: rtmp://72.60.249.175:1935/live" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

# Iniciar SRS
Write-Host "Iniciando servidor SRS em produção..." -ForegroundColor Green
try {
    ./srs.exe -c srs.prod.conf
} catch {
    Write-Host "ERRO ao iniciar SRS: $_" -ForegroundColor Red
    exit 1
}
