# Serviço TURN para WebRTC
# Porta: 3478 (compartilhada com STUN)
# Protocolo: UDP/TCP
# Função: Relay para contornar NAT/firewall restritivos

turn:
  # Configuração principal
  port: 3478
  protocols: [udp, tcp]
  
  # IPs do servidor
  primary_ip: 72.60.249.175
  backup_ip: 72.60.249.176
  
  # Credenciais (substituir em produção)
  username: livego
  password: livego123
  secret_key: livego-secret-key-2024
  
  # Limites de uso
  max_connections: 500
  rate_limit: 50/second
  bandwidth_limit: 1mbps per connection
  
  # Segurança
  allowed_origins: ["*"]  # Em produção, limitar
  tls_enabled: true
  cert_file: /etc/ssl/certs/livego.crt
  key_file: /etc/ssl/private/livego.key
  
  # Logging
  log_level: info
  log_file: /var/log/turn-server.log

# Configuração coturn (turnserver.conf)
listening-port=3478
tls-listening-port=5349
listening-ip=72.60.249.175
relay-ip=72.60.249.175
total-quota=100
user-quota=12
max-bps=64000

# Credenciais
use-auth-secret
static-auth-secret=livego-secret-key-2024
realm=livego

# Segurança
no-tlsv1
no-tlsv1_1
no-stdout-log
log-file=/var/log/turnserver.log
simple-log

# Docker Compose para TURN
version: '3.8'
services:
  turn-server:
    image: coturn/coturn:latest
    container_name: livego-turn
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
      - "5349:5349/tcp"  # TLS
    environment:
      - TURN_USERNAME=livego
      - TURN_PASSWORD=livego123
      - TURN_SECRET=livego-secret-key-2024
    volumes:
      - ./turn-config:/etc/coturn
      - ./ssl-certs:/etc/ssl/certs
      - ./ssl-private:/etc/ssl/private
    networks:
      - livego-network
    restart: unless-stopped
    depends_on:
      - stun-server

networks:
  livego-network:
    driver: bridge
