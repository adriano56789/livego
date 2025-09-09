#!/bin/bash

# Script de Deploy para LiveGo em VPS Ubuntu/Debian

# --- Variáveis de Configuração ---
REPO_URL="https://github.com/adriano56789/livego.git"
PROJECT_DIR="/opt/livego"

# --- Funções Auxiliares ---
log_info() { echo "\n🚀 INFO: $1"; }
log_success() { echo "\n✅ SUCESSO: $1"; }
log_error() { echo "\n❌ ERRO: $1"; exit 1; }

# --- 1. Atualizar o Sistema ---
log_info "Atualizando o sistema..."
sudo apt update && sudo apt upgrade -y || log_error "Falha ao atualizar o sistema."

# --- 2. Instalar Node.js e Yarn ---
log_info "Instalando Node.js e Yarn..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - || log_error "Falha ao adicionar repositório NodeSource."
sudo apt-get install -y nodejs || log_error "Falha ao instalar Node.js."
sudo npm install -g yarn || log_error "Falha ao instalar Yarn."

# --- 3. Instalar MongoDB ---
log_info "Instalando MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add - || log_error "Falha ao adicionar chave GPG do MongoDB."
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list || log_error "Falha ao adicionar repositório MongoDB."
sudo apt-get update || log_error "Falha ao atualizar apt para MongoDB."
sudo apt-get install -y mongodb-org || log_error "Falha ao instalar MongoDB."

log_info "Iniciando e habilitando MongoDB..."
sudo systemctl start mongod || log_error "Falha ao iniciar MongoDB."
sudo systemctl enable mongod || log_error "Falha ao habilitar MongoDB."

# --- 4. Clonar o Repositório LiveGo ---
log_info "Clonando o repositório LiveGo..."
if [ -d "$PROJECT_DIR" ]; then
  log_info "Removendo diretório existente: $PROJECT_DIR"
  sudo rm -rf $PROJECT_DIR || log_error "Falha ao remover diretório existente."
fi
sudo mkdir -p $PROJECT_DIR || log_error "Falha ao criar diretório do projeto."
sudo git clone $REPO_URL $PROJECT_DIR || log_error "Falha ao clonar o repositório."

# --- 5. Instalar Dependências ---
log_info "Instalando dependências do backend e frontend..."
cd $PROJECT_DIR || log_error "Falha ao entrar no diretório do projeto."
sudo yarn install || log_error "Falha ao instalar dependências do frontend."
cd api-server || log_error "Falha ao entrar no diretório api-server."
sudo yarn install || log_error "Falha ao instalar dependências do backend."
cd ..

# --- 6. Configurar LiveKit (se necessário, baixar e configurar) ---
log_info "Configurando LiveKit..."
# Baixar LiveKit CLI e Server
curl -sSL https://get.livekit.io | bash || log_error "Falha ao instalar LiveKit CLI e Server."

# Mover binários para /usr/local/bin para acesso global
sudo mv livekit-cli /usr/local/bin/ || log_error "Falha ao mover livekit-cli."
sudo mv livekit-server /usr/local/bin/ || log_error "Falha ao mover livekit-server."

# Copiar arquivo de configuração do LiveKit para o diretório do projeto
sudo cp livekit.yaml $PROJECT_DIR/livekit.yaml || log_error "Falha ao copiar livekit.yaml."

# --- 7. Iniciar Serviços (usando pm2 para persistência) ---
log_info "Instalando PM2 para gerenciar processos..."
sudo npm install -g pm2 || log_error "Falha ao instalar PM2."

log_info "Iniciando serviços com PM2..."

# Iniciar Backend
pm2 start $PROJECT_DIR/api-server/index.js --name "livego-backend" || log_error "Falha ao iniciar backend."

# Iniciar Frontend (usando serve para servir os arquivos estáticos)
cd $PROJECT_DIR
yarn build || log_error "Falha ao buildar o frontend."
sudo npm install -g serve || log_error "Falha ao instalar serve."
pm2 start serve --name "livego-frontend" -- $PROJECT_DIR/dist -l 5174 || log_error "Falha ao iniciar frontend."

# Iniciar LiveKit Server
pm2 start livekit-server --name "livego-livekit" -- --config $PROJECT_DIR/livekit.yaml || log_error "Falha ao iniciar LiveKit Server."

# Salvar configuração do PM2 para reiniciar após reboot
pm2 save || log_error "Falha ao salvar configuração do PM2."

log_success "Deploy do LiveGo concluído com sucesso!"
log_info "Verifique o status dos serviços com: pm2 list"
log_info "Acesse o frontend em: http://<SEU_IP_DA_VPS>:5174"


