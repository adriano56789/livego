#!/bin/bash

# Script para iniciar todos os serviços do LiveGo
# Executa verificações e inicia todos os containers Docker

set -e

# Configuração padrão
REBUILD=false
SHOW_LOGS=false
PROFILE="completo"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Função para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Função de ajuda
show_help() {
    echo -e "${CYAN}=== Script de Inicialização dos Serviços do LiveGo ===${NC}"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  -r, --rebuild       Reconstrói as imagens Docker"
    echo "  -l, --logs          Mostra logs após iniciar"
    echo "  -p, --profile NOME  Escolhe o perfil de serviços"
    echo "  -h, --help          Mostra esta ajuda"
    echo ""
    echo "Perfis disponíveis:"
    echo "  basico    - MongoDB + Backend API"
    echo "  simples   - MongoDB + Backend API + LiveKit"
    echo "  completo  - Todos os serviços (padrão)"
    echo ""
    echo "Exemplos:"
    echo "  $0                              # Inicia perfil completo"
    echo "  $0 -p basico                    # Inicia apenas serviços básicos"
    echo "  $0 -r -l -p completo           # Reconstrói, inicia completo e mostra logs"
}

# Processar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--rebuild)
            REBUILD=true
            shift
            ;;
        -l|--logs)
            SHOW_LOGS=true
            shift
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Verificar se o Docker está rodando
check_docker() {
    log_info "Verificando se o Docker está rodando..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker não está rodando! Por favor, inicie o Docker."
        exit 1
    fi
    
    log_success "Docker está funcionando"
}

# Verificar se o Docker Compose está disponível
check_docker_compose() {
    log_info "Verificando Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        log_error "Docker Compose não está disponível!"
        exit 1
    fi
    
    log_success "Docker Compose está disponível"
}

# Parar serviços existentes
stop_existing_services() {
    log_info "Parando serviços existentes..."
    
    $COMPOSE_CMD down &>/dev/null || true
    $COMPOSE_CMD -f docker-compose-basic.yml down &>/dev/null || true
    $COMPOSE_CMD -f docker-compose-simple.yml down &>/dev/null || true
    
    log_success "Serviços existentes parados"
}

# Escolher arquivo de configuração baseado no perfil
get_compose_file() {
    case "${PROFILE,,}" in
        "basico")
            log_info "Usando perfil básico (MongoDB + Backend API)"
            echo "docker-compose-basic.yml"
            ;;
        "simples")
            log_info "Usando perfil simples (MongoDB + Backend API + LiveKit)"
            echo "docker-compose-simple.yml"
            ;;
        "completo")
            log_info "Usando perfil completo (todos os serviços)"
            echo "docker-compose.yml"
            ;;
        *)
            log_warning "Perfil desconhecido '$PROFILE', usando básico"
            echo "docker-compose-basic.yml"
            ;;
    esac
}

# Construir imagens se necessário
build_images() {
    local compose_file=$1
    local rebuild=$2
    
    if [ "$rebuild" = true ]; then
        log_info "Reconstruindo imagens Docker..."
        if $COMPOSE_CMD -f "$compose_file" build --no-cache; then
            log_success "Imagens reconstruídas com sucesso"
        else
            log_error "Falha ao reconstruir imagens"
            return 1
        fi
    else
        log_info "Construindo imagens se necessário..."
        $COMPOSE_CMD -f "$compose_file" build || log_warning "Possível erro ao construir imagens"
    fi
    
    return 0
}

# Iniciar serviços
start_services() {
    local compose_file=$1
    
    log_info "Iniciando serviços com $compose_file..."
    
    if $COMPOSE_CMD -f "$compose_file" up -d; then
        log_success "Serviços iniciados com sucesso!"
        return 0
    else
        log_error "Falha ao iniciar serviços"
        return 1
    fi
}

# Verificar status dos serviços
check_services_status() {
    local compose_file=$1
    
    log_info "Verificando status dos serviços..."
    sleep 5
    
    echo ""
    echo -e "${YELLOW}=== Status dos Serviços ===${NC}"
    $COMPOSE_CMD -f "$compose_file" ps
    echo ""
    
    # Contar serviços saudáveis
    local healthy_count=0
    local total_count=0
    
    # Verificar se os serviços estão rodando
    while IFS= read -r line; do
        if [[ $line =~ "Up" ]] || [[ $line =~ "healthy" ]]; then
            ((healthy_count++))
        fi
        if [[ $line =~ "livego-1" ]]; then
            ((total_count++))
        fi
    done < <($COMPOSE_CMD -f "$compose_file" ps)
    
    if [ $healthy_count -eq $total_count ] && [ $total_count -gt 0 ]; then
        log_success "Todos os serviços estão funcionando ($healthy_count/$total_count)"
    else
        log_warning "$healthy_count de $total_count serviços estão funcionando"
    fi
}

# Mostrar URLs disponíveis
show_service_urls() {
    local profile=$1
    
    echo ""
    echo -e "${GREEN}=== URLs dos Serviços ===${NC}"
    echo -e "${WHITE}• API Backend: http://localhost:3000${NC}"
    echo -e "${WHITE}• API Health Check: http://localhost:3000/api/health${NC}"
    echo -e "${WHITE}• MongoDB: mongodb://localhost:27017${NC}"
    echo -e "${WHITE}• WebSocket: ws://localhost:3000${NC}"
    
    if [ "$profile" != "basico" ]; then
        echo -e "${WHITE}• LiveKit: ws://localhost:7880${NC}"
    fi
    
    if [ "$profile" = "completo" ]; then
        echo -e "${WHITE}• SRS RTMP: rtmp://localhost:1935${NC}"
        echo -e "${WHITE}• SRS HTTP API: http://localhost:1985${NC}"
        echo -e "${WHITE}• SRS HLS: http://localhost:8080${NC}"
    fi
    echo ""
}

# Mostrar logs se solicitado
show_logs() {
    local compose_file=$1
    
    log_info "Mostrando logs dos serviços..."
    echo -e "${YELLOW}Pressione Ctrl+C para parar de visualizar os logs${NC}"
    sleep 2
    
    $COMPOSE_CMD -f "$compose_file" logs -f
}

# Função principal
main() {
    echo -e "${CYAN}=== Iniciando Serviços do LiveGo ===${NC}"
    
    # Verificações iniciais
    check_docker
    check_docker_compose
    
    # Parar serviços existentes
    stop_existing_services
    
    # Obter arquivo de configuração
    local compose_file
    compose_file=$(get_compose_file)
    
    # Verificar se o arquivo existe
    if [ ! -f "$compose_file" ]; then
        log_error "Arquivo de configuração '$compose_file' não encontrado!"
        exit 1
    fi
    
    # Construir imagens
    if ! build_images "$compose_file" "$REBUILD"; then
        exit 1
    fi
    
    # Iniciar serviços
    if ! start_services "$compose_file"; then
        log_error "Falha ao iniciar serviços. Verificando logs..."
        $COMPOSE_CMD -f "$compose_file" logs --tail=20
        exit 1
    fi
    
    # Verificar status
    check_services_status "$compose_file"
    
    # Mostrar URLs
    show_service_urls "$PROFILE"
    
    # Comandos úteis
    echo -e "${CYAN}=== Comandos Úteis ===${NC}"
    echo -e "${WHITE}• Parar serviços: $COMPOSE_CMD -f $compose_file down${NC}"
    echo -e "${WHITE}• Ver logs: $COMPOSE_CMD -f $compose_file logs -f${NC}"
    echo -e "${WHITE}• Ver status: $COMPOSE_CMD -f $compose_file ps${NC}"
    echo -e "${WHITE}• Reiniciar: $0 --rebuild --profile $PROFILE${NC}"
    echo ""
    
    # Mostrar logs se solicitado
    if [ "$SHOW_LOGS" = true ]; then
        show_logs "$compose_file"
    fi
    
    log_success "=== Inicialização Completa! ==="
}

# Executar função principal
main "$@"