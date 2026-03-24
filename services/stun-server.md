# Serviço STUN para WebRTC
# Porta: 3478 (padrão STUN/TURN)
# Protocolo: UDP
# Função: Descobrir IP público atravessar NAT

stun:
  # Configuração principal
  port: 3478
  protocol: udp
  
  # IPs do servidor (substituir com IPs reais)
  primary_ip: 72.60.249.175
  backup_ip: 72.60.249.176
  
  # Limites de uso
  max_connections: 1000
  rate_limit: 100/second
  
  # Segurança
  allowed_origins: ["*"]  # Em produção, limitar para domínios específicos
  
  # Logging
  log_level: info
  log_file: /var/log/stun-server.log

# Docker Compose para STUN
version: '3.8'
services:
  stun-server:
    image: coturn/coturn:latest
    container_name: livego-stun
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
    environment:
      - TURN_USERNAME=livego
      - TURN_PASSWORD=livego123
    volumes:
      - ./stun-config:/etc/coturn
    networks:
      - livego-network
    restart: unless-stopped

networks:
  livego-network:
    driver: bridge
