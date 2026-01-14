#!/bin/bash

# Cria o diretório para o repositório bare
mkdir -p /var/repo/livego.git
cd /var/repo/livego.git
git init --bare

# Cria o diretório de produção
mkdir -p /var/www/livego

# Cria o hook post-receive
cat > /var/repo/livego.git/hooks/post-receive << 'EOL'
#!/bin/bash
TARGET="/var/www/livego"
GIT_DIR="/var/repo/livego.git"
BRANCH="main"

while read oldrev newrev ref
  do
    # only checking out the master (or whatever branch you would like to deploy)
    if [ "$ref" = "refs/heads/$BRANCH" ];
    then
        echo "Ref $ref received. Deploying ${BRANCH} branch to production..."
        git --work-tree=$TARGET --git-dir=$GIT_DIR checkout -f $BRANCH
        
        # Instala dependências e faz build
        cd $TARGET
        echo "Instalando dependências..."
        npm ci --production
        
        echo "Fazendo build do projeto..."
        npm run build
        
        # Reinicia o serviço PM2
        echo "Reiniciando o serviço..."
        pm2 delete livego-backend 2> /dev/null || true
        npm run vps:start
        
        echo "Deploy concluído!"
    else
        echo "Ref $ref recebida. Nenhum deploy feito. Apenas a branch ${BRANCH} pode ser implantada."
    fi
done
EOL

# Dá permissão de execução ao hook
chmod +x /var/repo/livego.git/hooks/post-receive

# Configura as permissões
chown -R $USER:$USER /var/repo/livego.git
chown -R $USER:$USER /var/www/livego

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "Para configurar seu repositório local, execute:"
echo ""
echo "git remote add vps ssh://usuario@seu-ip/var/repo/livego.git"
echo "git push vps main"
echo ""
echo "Substitua 'usuario' e 'seu-ip' pelos seus dados de acesso SSH."
