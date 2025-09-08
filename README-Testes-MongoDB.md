# Testes de Conexão MongoDB - LiveGo

Este diretório contém scripts para testar a conexão com o MongoDB do projeto LiveGo.

## 📁 Scripts de Teste Disponíveis

### Windows
- `testar-mongodb.bat` - Script simples para Windows (duplo-clique)
- `testar-mongodb.ps1` - Script PowerShell avançado
- `testar-mongodb.js` - Script Node.js principal

### Linux/macOS
- Use o script Node.js diretamente: `node testar-mongodb.js`

## 🚀 Como Executar os Testes

### Opção 1: Script Simples (Windows)
```bash
# Duplo-clique no arquivo
testar-mongodb.bat
```

### Opção 2: Script PowerShell (Avançado)
```powershell
# Teste básico
.\testar-mongodb.ps1

# Teste com URI personalizada
.\testar-mongodb.ps1 -Uri "mongodb://admin:admin123@localhost:27017/livego?authSource=admin"

# Forçar teste via Docker
.\testar-mongodb.ps1 -Docker

# Modo verboso
.\testar-mongodb.ps1 -Verbose
```

### Opção 3: Script Node.js Direto
```bash
# Instalar dependências (se necessário)
npm install mongodb

# Executar teste
node testar-mongodb.js

# Com URI personalizada
MONGO_URI="mongodb://admin:admin123@localhost:27017/livego?authSource=admin" node testar-mongodb.js
```

## 🔍 O que os Testes Verificam

### ✅ Verificações Realizadas
1. **Conectividade de Rede** - Porta 27017 acessível
2. **Autenticação** - Credenciais admin:admin123
3. **Conexão com MongoDB** - Estabelecimento da conexão
4. **Seleção do Banco** - Acesso ao banco 'livego'
5. **Listagem de Coleções** - Ver coleções existentes
6. **Operação de Escrita** - Inserir documento de teste
7. **Operação de Leitura** - Ler documento inserido
8. **Limpeza** - Remover documento de teste
9. **Estatísticas** - Contar documentos nas coleções principais

### 📊 Informações Coletadas
- **Usuários** - Quantidade na coleção `users`
- **Streams** - Quantidade na coleção `streams`
- **Mensagens** - Quantidade na coleção `chat_messages`
- **Coleções** - Lista de todas as coleções existentes

## 🌐 Configuração de Conexão

### URI Padrão
```
mongodb://admin:admin123@localhost:27017/livego?authSource=admin
```

### Componentes da URI
- **Usuário**: `admin`
- **Senha**: `admin123`
- **Host**: `localhost`
- **Porta**: `27017`
- **Banco**: `livego`
- **Auth Source**: `admin`

## 🔧 Resolução de Problemas

### Erro: "ECONNREFUSED"
**Problema**: MongoDB não está rodando

**Soluções**:
1. Verificar se Docker está rodando
2. Iniciar serviços: `docker compose -f docker-compose-basic.yml up -d`
3. Aguardar alguns segundos para inicialização
4. Executar teste novamente

### Erro: "Authentication failed"
**Problema**: Credenciais incorretas

**Soluções**:
1. Verificar credenciais: `admin:admin123`
2. Confirmar `authSource=admin`
3. Reiniciar container MongoDB se necessário

### Erro: "require is not defined"
**Problema**: Projeto configurado como ES module

**Solução**: O script já foi corrigido para usar `import` ao invés de `require`

### Porta já em uso
**Problema**: Porta 27017 ocupada por outro serviço

**Soluções**:
```bash
# Ver quem está usando a porta
netstat -an | find "27017"

# Parar outros MongoDB
docker stop $(docker ps -q --filter "ancestor=mongo")

# Usar porta diferente no docker-compose
```

## 📝 Exemplo de Saída Bem-Sucedida

```
🔄 Iniciando teste de conexão com MongoDB...
📍 URI de conexão: mongodb://admin:admin123@localhost:27017/livego?authSource=admin
⏳ Conectando ao MongoDB...
✅ Conexão estabelecida com sucesso!
📊 Banco de dados selecionado: livego
📂 Coleções encontradas: 3
📋 Lista de coleções:
   - gifts
   - streams
   - users
✍️  Testando operação de escrita...
✅ Documento inserido com ID: new ObjectId('...')
📖 Testando operação de leitura...
✅ Documento lido: { ... }
🧹 Documento de teste removido

📊 Verificando dados do LiveGo...
👥 Usuários no banco: 2
📺 Streams no banco: 1
💬 Mensagens no banco: 0

🎉 Teste de conexão MongoDB CONCLUÍDO COM SUCESSO!
🔌 Conexão fechada
```

## 🎯 Comandos Rápidos

### Verificar Status do MongoDB
```bash
docker compose -f docker-compose-basic.yml ps mongodb
```

### Ver Logs do MongoDB
```bash
docker compose -f docker-compose-basic.yml logs mongodb
```

### Reiniciar MongoDB
```bash
docker compose -f docker-compose-basic.yml restart mongodb
```

### Conectar ao MongoDB via CLI
```bash
# Via Docker
docker exec -it mongodb mongosh -u admin -p admin123 --authenticationDatabase admin

# Via mongosh local (se instalado)
mongosh "mongodb://admin:admin123@localhost:27017/livego?authSource=admin"
```

## 🔐 Segurança

### ⚠️ Nota Importante
As credenciais `admin:admin123` são apenas para desenvolvimento local. 

**Para produção**:
1. Use credenciais seguras
2. Configure SSL/TLS
3. Restrinja acesso por IP
4. Use variáveis de ambiente para credenciais

---

**Dica**: Execute `testar-mongodb.bat` regularmente para verificar se o MongoDB está funcionando corretamente!