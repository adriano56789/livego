# Script para iniciar SRS com autenticação HTTP API
# Seguindo documentação oficial: https://ossrs.io/lts/en-us/docs/v6/doc/http-api#authentication

Write-Host "🚀 Iniciando SRS com autenticação HTTP API..." -ForegroundColor Green

# Iniciar servidor SRS com Docker
try {
    docker run -d --name srs-server --restart unless-stopped -p "1935:1935/tcp" -p "1985:1985/tcp" -p "8080:8080/tcp" -p "8000:8000/udp" -p "9000:9000/tcp" -p "5060:5060/tcp" -p "10080:10080/udp" -v "$(Get-Location)/srs.conf:/usr/local/srs/conf/srs.conf" -v "$(Get-Location)/srs-logs:/usr/local/srs/objs/logs" -e SRS_DAEMON=off -e SRS_IN_DOCKER=on -e TURN_SERVER_URL=turn:72.60.249.175:3478 -e TURN_USERNAME=livego -e TURN_PASSWORD=adriano123 ossrs/srs:5

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SRS Server iniciado com sucesso!" -ForegroundColor Green
        Write-Host "📡 API HTTP: http://localhost:1985" -ForegroundColor Cyan
        Write-Host "🔗 RTMP: rtmp://localhost:1935/live" -ForegroundColor Cyan
        Write-Host "🌐 HTTP: http://localhost:8080" -ForegroundColor Cyan
        Write-Host "🔗 WebRTC: webrtc://localhost:8000/live" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔐 Testando API com autenticação:" -ForegroundColor Yellow
        Write-Host "curl -u admin:admin http://localhost:1985/api/v1/versions" -ForegroundColor White
    } else {
        Write-Host "❌ Erro ao iniciar SRS Server" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao iniciar SRS Server: $_" -ForegroundColor Red
}
