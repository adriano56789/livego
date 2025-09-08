#!/bin/bash

# Script de configuração e verificação do ambiente LiveGo
# Este script prepara o ambiente e verifica se tudo está configurado corretamente

echo "=== Configuração do Ambiente LiveGo ==="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se o Docker está instalado e funcionando
check_docker() {
    log_info "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker não está rodando!"
        exit 1
    fi
    
    log_success "Docker está funcionando corretamente"
}

# Verificar se o Docker Compose está disponível
check_docker_compose() {
    log_info "Verificando Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose não está disponível!"
        exit 1
    fi
    log_success "Docker Compose está disponível"
}

# Verificar arquivos de configuração necessários
check_config_files() {
    log_info "Verificando arquivos de configuração..."
    
    local required_files=(
        "docker-compose.yml"
        "srs.conf"
        "livekit.yaml"
        "api-server/Dockerfile"
        "api-server/package.json"
        "api-server/index.js"
        "api-server/startup.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Arquivo necessário não encontrado: $file"
            exit 1
        fi
    done
    
    log_success "Todos os arquivos de configuração estão presentes"
}

# Verificar portas disponíveis
check_ports() {
    log_info "Verificando portas necessárias..."
    
    local ports=(1935 1985 8080 8000 7880 7881 3000 27017)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            occupied_ports+=("$port")
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        log_warning "As seguintes portas já estão em uso: ${occupied_ports[*]}"
        log_warning "Isso pode causar conflitos. Considere parar outros serviços."
    else
        log_success "Todas as portas necessárias estão disponíveis"
    fi
}

# Criar diretórios necessários
create_directories() {
    log_info "Criando diretórios necessários..."
    
    local directories=(
        "mongodb_data"
        "srs_data"
        "logs"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "Diretório criado: $dir"
        fi
    done
    
    log_success "Diretórios criados/verificados"
}

# Construir imagens Docker
build_images() {
    log_info "Construindo imagens Docker..."
    
    if docker compose build --no-cache; then
        log_success "Imagens construídas com sucesso"
    else
        log_error "Falha ao construir imagens"
        exit 1
    fi
}

# Verificar conectividade de rede
check_network() {
    log_info "Verificando configuração de rede..."
    
    # Remover rede existente se houver
    docker network rm livego-network 2>/dev/null || true
    
    # Criar rede customizada
    if docker network create --driver bridge --subnet=172.20.0.0/16 --gateway=172.20.0.1 livego-network 2>/dev/null; then
        log_success "Rede livego-network criada"
    else
        log_warning "Rede livego-network já existe ou falha ao criar"
    fi
}

# Função principal
main() {
    log_info "Iniciando verificação e configuração do ambiente..."
    
    check_docker
    check_docker_compose
    check_config_files
    check_ports
    create_directories
    check_network
    build_images
    
    echo ""
    log_success "=== Configuração completa! ==="
    echo ""
    log_info "Para iniciar os serviços, execute:"
    echo "  docker compose up -d"
    echo ""
    log_info "Para verificar o status dos serviços:"
    echo "  docker compose ps"
    echo ""
    log_info "Para visualizar logs:"
    echo "  docker compose logs -f"
    echo ""
    log_info "URLs dos serviços:"
    echo "  - API Backend: http://localhost:3000"
    echo "  - SRS HTTP API: http://localhost:1985"
    echo "  - SRS HLS/HTTP: http://localhost:8080"
    echo "  - LiveKit: ws://localhost:7880"
    echo "  - MongoDB: mongodb://localhost:27017"
}

# Executar função principal
main "$@"