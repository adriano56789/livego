# Manual de Deploy na VPS - LiveGo (Revisão de Estabilidade)

Este guia foi atualizado para garantir um deploy limpo, estável e sem conflitos. Siga estes passos para configurar seu ambiente de produção corretamente.

**A Estratégia Correta:**

1.  **Backend (API):** Será um único processo Node.js, iniciado a partir do código compilado, e gerenciado pelo `PM2`. Ele escutará **apenas** na porta `3000`.
2.  **Frontend (Interface):** Será compilado em arquivos estáticos (HTML/JS/CSS) e servido pelo `Nginx`. O Nginx também redirecionará as chamadas `/api` para o backend. **Não se usa PM2 para o frontend.**

---

### Passo 0: Limpeza Geral (MUITO IMPORTANTE)

Antes de começar, vamos garantir que não há nenhum processo antigo rodando e causando conflitos.

```bash
# Para todos os processos gerenciados pelo PM2
pm2 delete all

# Para garantir que nenhum processo 'node' perdido ficou para trás
sudo pkill -f node
```

---

### Passo 1: Deploy do Frontend (Servido pelo Nginx)

Execute estes comandos na pasta raiz do seu projeto (`/var/www/livego`).

```bash
# 1. Instala/atualiza as dependências do frontend
npm install

# 2. Compila seu código React para arquivos estáticos otimizados
npm run build
```
-   **Resultado:** Uma pasta `dist/` será criada em `/var/www/livego`. O Nginx deve ser configurado para usar esta pasta como `root`. A configuração do Nginx do guia anterior continua válida.

---

### Passo 2: Deploy do Backend (Gerenciado pelo PM2)

Execute estes comandos **dentro da pasta do backend** (`/var/www/livego/backend`).

```bash
# 1. Instala/atualiza as dependências e compila o código para produção
#    (O script "postinstall" no package.json vai rodar o "build" automaticamente)
npm install --production

# 2. Inicia o servidor com PM2 de forma limpa e correta
#    Este comando lê o package.json e inicia o "main" script ("dist/server.js")
pm2 start . --name "livego-backend"
```

-   **O que mudou?** Agora, `pm2 start .` inicia diretamente o `node dist/server.js`, sem usar `npm` ou `nodemon`. Isso garante **um único processo estável**, resolvendo a causa raiz dos seus problemas.

---

### Passo 3: Verificação Final

Após iniciar o backend, verifique se tudo está correto.

```bash
# 1. Verifique o status no PM2. Deve haver apenas 'livego-backend' online.
pm2 status

# 2. Verifique os logs iniciais. Você deve ver a mensagem de "API REST DEDICADA LIVEGO - ONLINE".
pm2 logs livego-backend --lines 20

# 3. Teste a conexão interna diretamente na porta 3000.
curl -I http://localhost:3000/api/status
```

Se todos os passos acima funcionarem sem erros, seu ambiente está configurado de forma estável e correta. O acesso externo pelo seu domínio `livego.store` será gerenciado pelo Nginx.

---

### Comandos Úteis do PM2

```bash
# Salvar a lista de processos para reiniciar automaticamente com o servidor
pm2 save

# Reiniciar o backend após uma atualização de código (faça 'npm install' antes se necessário)
pm2 restart livego-backend

# Parar o backend
pm2 stop livego-backend

# Remover o backend da lista do PM2
pm2 delete livego-backend
```