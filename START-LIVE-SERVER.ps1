# Script para iniciar apenas os servidores de Live (SRS + Coturn)
# Mantendo o Backend e Banco de Dados intocados conforme solicitado.

Write-Host "Iniciando Servidores de Live (SRS + WebRTC)..."

# 1. Verificar se o Docker está rodando
if (!(Get-Process docker -ErrorAction SilentlyContinue)) {
    Write-Host "Erro: Docker Desktop nao esta rodando. Por favor, inicie o Docker."
    exit
}

# 2. Subir os containers de Live
Write-Host "Subindo containers SRS e Coturn..."
# O script assume que esta sendo executado dentro da pasta do projeto
docker-compose up -d srs-server coturn-server

# 3. Verificar status
Write-Host "Verificando status dos servicos..."
docker ps --filter "name=srs-server" --filter "name=coturn-server"

Write-Host "Servidores de Live configurados e rodando!"
Write-Host "SRS API: http://72.60.249.175:1985"
Write-Host "SRS WebRTC (UDP): 72.60.249.175:8000"
Write-Host "Coturn (STUN/TURN): 72.60.249.175:3478"
Write-Host "Lembre-se de liberar as portas 1935(TCP), 1985(TCP), 8080(TCP), 8000(UDP) e 3478(TCP/UDP) no seu Firewall/Roteador."
