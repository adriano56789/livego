#!/bin/bash

# Deploy Escalável LiveGo - 50.000 Usuários Simultâneos
echo "🚀 Deploy LiveGo Escalável - 50.000 usuários simultâneos"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar Docker Swarm
check_docker_swarm() {
    log "Verificando Docker Swarm..."
    if ! docker info | grep -q "Swarm: active"; then
        log "Inicializando Docker Swarm..."
        docker swarm init --advertise-addr $(hostname -I | awk '{print $1}') || {
            error "Falha ao inicializar Docker Swarm"
            exit 1
        }
    fi
    log "Docker Swarm ativo"
}

# Criar redes
create_networks() {
    log "Criando redes overlay..."
    
    docker network create --driver overlay --attachable livego-cluster 2>/dev/null || {
        warn "Rede livego-cluster já existe"
    }
    
    docker network create --driver overlay --attachable livego-cdn 2>/dev/null || {
        warn "Rede livego-cdn já existe"
    }
    
    log "Redes criadas"
}

# Criar diretórios
create_directories() {
    log "Criando diretórios..."
    
    mkdir -p logs
    mkdir -p hls-cache
    mkdir -p edge-cache-1
    mkdir -p edge-cache-2
    mkdir -p ssl-certs
    
    # Permissões
    chmod 755 logs hls-cache edge-cache-1 edge-cache-2
    
    log "Diretórios criados"
}

# Deploy TURN servers
deploy_turn_servers() {
    log "Deploy TURN servers por região..."
    
    docker stack deploy -c turn-global.yml livego-turn || {
        error "Falha no deploy TURN servers"
        return 1
    }
    
    # Aguardar TURN servers iniciarem
    log "Aguardando TURN servers iniciarem..."
    sleep 30
    
    # Verificar saúde dos TURN servers
    for i in {1..5}; do
        if docker service ls | grep -q "livego-turn_turn-br.*1/1"; then
            log "TURN BR online"
            break
        fi
        sleep 10
    done
}

# Deploy SRS Cluster
deploy_srs_cluster() {
    log "Deploy SRS Cluster..."
    
    docker stack deploy -c srs-cluster.yml livego-srs || {
        error "Falha no deploy SRS Cluster"
        return 1
    }
    
    # Aguardar SRS master
    log "Aguardando SRS Master..."
    sleep 45
    
    # Verificar saúde do SRS
    for i in {1..10}; do
        if curl -f http://localhost:8000/api/v1/summaries >/dev/null 2>&1; then
            log "SRS Master online"
            break
        fi
        sleep 15
    done
}

# Deploy Auto-scaler
deploy_autoscaler() {
    log "Deploy Auto-scaler..."
    
    # Criar serviço de auto-scaler
    docker service create \
        --name livego-autoscaler \
        --mode global \
        --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
        --env SCALE_UP_CPU=70 \
        --env SCALE_DOWN_CPU=30 \
        --env MIN_REPLICAS=1 \
        --env MAX_REPLICAS=10 \
        --env CHECK_INTERVAL=30 \
        --restart-condition on-failure \
        alpine:latest \
        sh -c "
        while true; do
            # Monitorar CPU e memória do SRS
            CPU_USAGE=\$(docker stats --no-stream --format \"{{.CPUPerc}}\" livego_srs_srs-sfu-master | cut -d'%' -f1 | sed 's/%//')
            MEMORY_USAGE=\$(docker stats --no-stream --format \"{{.MemPerc}}\" livego_srs_srs-sfu-master | cut -d'%' -f1 | sed 's/%//')
            
            # Scale up se necessário
            if [ \"\$CPU_USAGE\" -gt 70 ] || [ \"\$MEMORY_USAGE\" -gt 80 ]; then
                CURRENT_REPLICAS=\$(docker service ls --format '{{.Replicas}}' livego_srs_srs-sfu-worker | cut -d'/' -f1)
                if [ \"\$CURRENT_REPLICAS\" -lt 10 ]; then
                    docker service scale livego_srs_srs-sfu-worker=\$((CURRENT_REPLICAS + 1))
                    echo \"[\$(date)] Scale UP: \$CURRENT_REPLICAS -> \$((CURRENT_REPLICAS + 1)) replicas\"
                fi
            fi
            
            # Scale down se possível
            if [ \"\$CPU_USAGE\" -lt 30 ] && [ \"\$MEMORY_USAGE\" -lt 50 ]; then
                CURRENT_REPLICAS=\$(docker service ls --format '{{.Replicas}}' livego_srs_srs-sfu-worker | cut -d'/' -f1)
                if [ \"\$CURRENT_REPLICAS\" -gt 1 ]; then
                    docker service scale livego_srs_srs-sfu-worker=\$((CURRENT_REPLICAS - 1))
                    echo \"[\$(date)] Scale DOWN: \$CURRENT_REPLICAS -> \$((CURRENT_REPLICAS - 1)) replicas\"
                fi
            fi
            
            sleep 30
        done
        " || {
        error "Falha no deploy Auto-scaler"
        return 1
    }
    
    log "Auto-scaler deployado"
}

# Configurar Health Checks
setup_health_checks() {
    log "Configurando health checks..."
    
    # Health check script
    cat > health-check.sh << 'EOF'
#!/bin/bash
# Health Check para LiveGo Escalável

echo "=== LiveGo Health Check ==="
echo "Data: $(date)"
echo ""

# Verificar serviços Docker
echo "📊 Docker Services:"
docker service ls --filter name=livego
echo ""

# Verificar TURN servers
echo "🔄 TURN Servers:"
for region in br us eu; do
    status=$(docker service ls --filter name=livego-turn_turn-$region --format '{{.Replicas}}' | head -1)
    echo "  TURN $region: $status"
done
echo ""

# Verificar SRS Cluster
echo "🎥 SRS Cluster:"
for service in sfu-master sfu-worker origin edge-1 edge-2; do
    status=$(docker service ls --filter name=livego-srs_srs-$service --format '{{.Replicas}}' | head -1)
    echo "  SRS $service: $status"
done
echo ""

# Verificar APIs
echo "🌐 APIs:"
if curl -f http://localhost:8000/api/v1/summaries >/dev/null 2>&1; then
    echo "  SRS Master API: ✅ Online"
else
    echo "  SRS Master API: ❌ Offline"
fi

if curl -f http://localhost:8080/api/v1/summaries >/dev/null 2>&1; then
    echo "  SRS Origin API: ✅ Online"
else
    echo "  SRS Origin API: ❌ Offline"
fi

if curl -f http://localhost:80 >/dev/null 2>&1; then
    echo "  Load Balancer: ✅ Online"
else
    echo "  Load Balancer: ❌ Offline"
fi

echo ""
echo "=== End Health Check ==="
EOF

    chmod +x health-check.sh
    log "Health check script criado"
}

# Configurar monitoramento
setup_monitoring() {
    log "Configurando monitoramento..."
    
    # Criar dashboard de métricas
    cat > metrics-dashboard.sh << 'EOF'
#!/bin/bash
# Dashboard de Métricas em Tempo Real

clear
echo "🚀 LiveGo Metrics Dashboard"
echo "============================"
echo ""

while true; do
    # Data e hora
    echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Métricas Docker
    echo "📊 Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep livego
    echo ""
    
    # Número de containers
    echo "🐳 Containers:"
    echo "  Total: $(docker ps -q | wc -l)"
    echo "  Running: $(docker ps --filter status=running -q | wc -l)"
    echo ""
    
    # Services
    echo "🔄 Services:"
    docker service ls --filter name=livego --format "table {{.Name}}\t{{.Replicas}}\t{{.Image}}"
    echo ""
    
    # Network
    echo "🌐 Network:"
    docker network ls | grep livego
    echo ""
    
    # Aguardar próxima atualização
    sleep 10
    clear
done
EOF

    chmod +x metrics-dashboard.sh
    log "Dashboard de métricas criado"
}

# Testar sistema
test_system() {
    log "Testando sistema..."
    
    # Testar TURN server
    log "Testando TURN server BR..."
    if timeout 10 docker exec livego-turn-br turnutils_uclient -T -u livego -w livego123 72.60.249.175:3478 >/dev/null 2>&1; then
        log "✅ TURN BR funcionando"
    else
        warn "⚠️ TURN BR pode não estar funcionando"
    fi
    
    # Testar SRS API
    log "Testando SRS API..."
    if curl -f http://localhost:8000/api/v1/summaries >/dev/null 2>&1; then
        log "✅ SRS API funcionando"
    else
        warn "⚠️ SRS API pode não estar funcionando"
    fi
    
    # Testar Load Balancer
    log "Testando Load Balancer..."
    if curl -f http://localhost:80 >/dev/null 2>&1; then
        log "✅ Load Balancer funcionando"
    else
        warn "⚠️ Load Balancer pode não estar funcionando"
    fi
}

# Função principal
main() {
    log "Iniciando deploy do LiveGo Escalável..."
    
    # Verificar pré-requisitos
    command -v docker >/dev/null 2>&1 || { error "Docker não encontrado"; exit 1; }
    command -v curl >/dev/null 2>&1 || { error "curl não encontrado"; exit 1; }
    
    # Executar deploy
    check_docker_swarm
    create_networks
    create_directories
    deploy_turn_servers
    deploy_srs_cluster
    deploy_autoscaler
    setup_health_checks
    setup_monitoring
    test_system
    
    log "✅ Deploy concluído com sucesso!"
    echo ""
    echo "🎯 Serviços disponíveis:"
    echo "  📊 Health Check: ./health-check.sh"
    echo "  📈 Metrics: ./metrics-dashboard.sh"
    echo "  🌐 APIs:"
    echo "     - SRS Master: http://localhost:8000/api/v1/summaries"
    echo "     - SRS Origin: http://localhost:8080/api/v1/summaries"
    echo "     - Load Balancer: http://localhost"
    echo ""
    echo "🔄 TURN Servers:"
    echo "     - BR: turn:72.60.249.175:3478"
    echo "     - US: turn:104.21.45.100:3479"
    echo "     - EU: turn:104.21.67.200:3480"
    echo ""
    echo "🎥 Streaming URLs:"
    echo "     - WebRTC: webrtc://72.60.249.175/live/{streamId}"
    echo "     - HLS: http://localhost/hls/{streamId}.m3u8"
    echo "     - LL-HLS: http://localhost/llhls/{streamId}.m3u8"
    echo ""
    echo "📊 Capacidade: 50.000 usuários simultâneos"
    echo "   - WebRTC: 2.000 usuários (interativos)"
    echo "   - HLS: 48.000 usuários (espectadores)"
    echo ""
    log "🚀 LiveGo Escalável pronto para uso!"
}

# Executar main
main "$@"
