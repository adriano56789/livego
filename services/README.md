# 🚀 Serviços WebRTC - LiveGo

## 📋 Visão Geral

Este diretório contém todos os arquivos de configuração necessários para rodar os serviços WebRTC (STUN/TURN/SRS) que resolvem o erro 500 no `/publish`.

## 🔧 Arquivos Criados

### 1. **Docker Compose** - `docker-compose.yml`
- Container **coturn** (STUN/TURN combinado)
- Container **SRS** (Simple Realtime Server)
- Rede Docker dedicada
- Health checks automáticos

### 2. **Configuração TURN** - `turnserver.conf`
- Porta 3478 (UDP/TCP)
- Credenciais: `livego:livego123`
- IP: `72.60.249.175`
- Relay ports: 49152-65535

### 3. **Configuração SRS** - `srs.conf`
- WebRTC habilitado
- STUN/TURN configurados
- HLS/FLV/RTMP suportados
- Codecs: H264, VP8, VP9, AV1, Opus

### 4. **Scripts de Inicialização**
- `start-webrtc-services.sh` (Linux/Mac)
- `start-webrtc-services.bat` (Windows)
- Testes automáticos de conectividade

### 5. **Variáveis de Ambiente** - `.env.webrtc`
- URLs STUN/TURN
- Credenciais
- Endpoints SRS
- Configurações de debug

## 🚀 Como Usar

### Windows:
```bash
cd services
start-webrtc-services.bat
```

### Linux/Mac:
```bash
cd services
chmod +x start-webrtc-services.sh
./start-webrtc-services.sh
```

## 📊 Endpoints Configurados

| Serviço | URL | Porta | Protocolo |
|---------|-----|--------|-----------|
| STUN | `stun:72.60.249.175:3478` | 3478 | UDP |
| TURN | `turn:72.60.249.175:3478` | 3478 | UDP/TCP |
| RTMP | `rtmp://72.60.249.175:1935/live` | 1935 | TCP |
| HLS | `http://72.60.249.175:8000/live/` | 8000 | HTTP |
| FLV | `http://72.60.249.175:8088/live/` | 8088 | HTTP |
| WebRTC | `webrtc://72.60.249.175/live/` | 10080 | UDP |
| API SRS | `http://72.60.249.175:8080/api/` | 8080 | HTTP |

## 🔍 Verificação

### Testar STUN:
```bash
docker exec livego-coturn turnutils_uclient -T -u livego -w livego123 72.60.249.175:3478
```

### Testar API SRS:
```bash
curl http://localhost:8080/api/v1/summaries
```

### Verificar Logs:
```bash
# STUN/TURN
docker logs livego-coturn

# SRS
docker logs livego-srs

# Ambos
docker-compose logs -f
```

## 🛠️ Comandos Úteis

```bash
# Reiniciar serviços
docker-compose restart

# Parar serviços
docker-compose down

# Verificar status
docker-compose ps

# Reconstruir containers
docker-compose up -d --build

# Limpar tudo
docker-compose down -v
docker system prune -f
```

## 🔧 Configuração Frontend

O frontend já está configurado para usar estes servidores através das variáveis de ambiente em `.env.webrtc`:

```typescript
// services/webrtcIceConfig.ts
VITE_STUN_URL=stun:72.60.249.175:3478
VITE_TURN_URL=turn:72.60.249.175:3478
VITE_TURN_USER=livego
VITE_TURN_PASS=livego123
```

## 🐛 Troubleshooting

### Erro 500 no `/publish`:
✅ **RESOLVIDO**: Era falta dos serviços STUN/TURN. 
- Execute `start-webrtc-services.bat`
- Aguarde 30 segundos para inicialização completa

### WebRTC não conecta:
1. Verifique se os containers estão rodando: `docker-compose ps`
2. Verifique logs: `docker-compose logs`
3. Teste conectividade: `curl http://localhost:8080/api/v1/summaries`

### Portas bloqueadas:
- Libere portas 3478, 1935, 8080, 8000, 8088 no firewall
- Configure NAT/forwarding se necessário

## 📈 Monitoramento

Os serviços incluem health checks automáticos:
- **coturn**: Teste de conectividade STUN/TURN a cada 30s
- **SRS**: Teste de API a cada 30s

Status disponível em:
```bash
docker-compose ps
```

## 🔐 Segurança

Para produção:
1. Troque senhas padrão (`livego123`)
2. Configure certificados TLS
3. Limite origens permitidas
4. Use redes privadas
5. Configure rate limiting

## ✅ Resultado Esperado

Após executar os serviços:
- ✅ Erro 500 no `/publish` resolvido
- ✅ WebRTC funcionando com baixa latência
- ✅ Fallback HLS/FLV funcionando
- ✅ Streaming estável para todos os navegadores
- ✅ Suporte mobile completo

O sistema estará pronto para produção com WebRTC nativo! 🎥🚀
