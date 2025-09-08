# Scripts de Inicialização dos Serviços do LiveGo

Este diretório contém scripts para iniciar todos os serviços do LiveGo de uma vez só usando Docker Compose.

## 📁 Scripts Disponíveis

### Windows
- `iniciar-servicos.bat` - Script simples para Windows (duplo-clique para executar)
- `iniciar-servicos.ps1` - Script avançado para PowerShell

### Linux/macOS  
- `iniciar-servicos.sh` - Script para sistemas Unix

## 🚀 Como Usar

### Windows (Opção 1 - Simples)
1. **Duplo-clique** no arquivo `iniciar-servicos.bat`
2. Escolha o perfil de serviços (1, 2 ou 3)
3. Aguarde a inicialização
4. Acesse os serviços nas URLs mostradas

### Windows (Opção 2 - Avançado)
```powershell
# Executar com perfil básico
.\iniciar-servicos.ps1 -Profile basico

# Executar com perfil completo e reconstruir imagens
.\iniciar-servicos.ps1 -Profile completo -Rebuild

# Executar e mostrar logs em tempo real
.\iniciar-servicos.ps1 -Profile simples -Logs

# Ver ajuda
.\iniciar-servicos.ps1 -?
```

### Linux/macOS
```bash
# Tornar executável (apenas primeira vez)
chmod +x iniciar-servicos.sh

# Executar com perfil básico
./iniciar-servicos.sh --profile basico

# Executar com perfil completo e reconstruir
./iniciar-servicos.sh --rebuild --profile completo

# Executar e mostrar logs
./iniciar-servicos.sh --logs --profile simples

# Ver ajuda
./iniciar-servicos.sh --help
```

## 📋 Perfis Disponíveis

### 1. Básico (`basico`)
- **Serviços**: MongoDB + Backend API
- **Arquivo**: `docker-compose-basic.yml`
- **Ideal para**: Desenvolvimento básico, testes de API

### 2. Simples (`simples`)  
- **Serviços**: MongoDB + Backend API + LiveKit
- **Arquivo**: `docker-compose-simple.yml`
- **Ideal para**: Desenvolvimento com WebRTC

### 3. Completo (`completo`)
- **Serviços**: MongoDB + Backend API + LiveKit + SRS
- **Arquivo**: `docker-compose.yml`
- **Ideal para**: Desenvolvimento completo, produção

## 🌐 URLs dos Serviços

### Todos os Perfis
- **API Backend**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health
- **MongoDB**: mongodb://localhost:27017
- **WebSocket**: ws://localhost:3000

### Perfil Simples e Completo
- **LiveKit**: ws://localhost:7880

### Apenas Perfil Completo
- **SRS RTMP**: rtmp://localhost:1935
- **SRS HTTP API**: http://localhost:1985  
- **SRS HLS**: http://localhost:8080

## 🛠️ Comandos Úteis

### Parar Serviços
```bash
# Para qualquer perfil
docker compose down
docker compose -f docker-compose-basic.yml down
docker compose -f docker-compose-simple.yml down
```

### Ver Status
```bash
docker compose ps
# ou para um arquivo específico
docker compose -f docker-compose-basic.yml ps
```

### Ver Logs
```bash
# Logs em tempo real
docker compose logs -f

# Logs de um serviço específico
docker compose logs -f api
docker compose logs -f mongodb
```

### Reconstruir Imagens
```bash
docker compose build --no-cache
```

## 🔧 Resolução de Problemas

### Docker não está rodando
- **Windows**: Inicie o Docker Desktop
- **Linux**: Execute `sudo systemctl start docker`
- **macOS**: Inicie o Docker Desktop

### Portas já em uso
Se receber erro de porta em uso, pare outros serviços:
```bash
# Ver processos usando portas
netstat -tulpn | grep :3000
netstat -tulpn | grep :27017

# Parar containers conflitantes
docker ps
docker stop <container_id>
```

### Problemas de permissão (Linux/macOS)
```bash
# Dar permissão de execução
chmod +x iniciar-servicos.sh

# Executar com sudo se necessário
sudo ./iniciar-servicos.sh
```

### Reconstruir do Zero
```bash
# Parar tudo e limpar
docker compose down
docker system prune -f

# Reconstruir e iniciar
.\iniciar-servicos.ps1 -Rebuild -Profile completo
```

## 📝 Estrutura dos Arquivos

```
livego-1/
├── docker-compose.yml          # Configuração completa
├── docker-compose-simple.yml   # Configuração simples  
├── docker-compose-basic.yml    # Configuração básica
├── iniciar-servicos.bat        # Script Windows simples
├── iniciar-servicos.ps1        # Script PowerShell avançado
├── iniciar-servicos.sh         # Script Linux/macOS
└── README-Scripts.md           # Este arquivo
```

## 🎯 Exemplos de Uso

### Desenvolvimento Diário
```bash
# Iniciar rapidamente para desenvolvimento
.\iniciar-servicos.bat
# Escolher opção 1 (Básico)
```

### Teste Completo
```powershell
# Iniciar tudo e acompanhar logs
.\iniciar-servicos.ps1 -Profile completo -Logs
```

### Ambiente Limpo
```powershell
# Reconstruir tudo do zero
.\iniciar-servicos.ps1 -Rebuild -Profile completo
```

---

**Dica**: Sempre verifique se o Docker Desktop está rodando antes de executar os scripts!