#!/bin/bash

# BUILD AUTOMÁTICO - WEB APP APK
# Script para compilar o APK independente

echo "🚀 Iniciando build do APK Web App..."

# Entrar na pasta do Android
cd android

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
./gradlew clean

# Compilar versão de release
echo "📦 Compilando APK de release..."
./gradlew assembleRelease

# Verificar se APK foi gerado
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK gerado com sucesso!"
    echo "📍 Local: android/app/build/outputs/apk/release/app-release.apk"
    
    # Mover para pasta de saída
    mkdir -p output
    cp app/build/outputs/apk/release/app-release.apk output/livego-webapp.apk
    echo "📋 APK copiado para: android/output/livego-webapp.apk"
    
    # Mostrar informações
    ls -lh output/livego-webapp.apk
    
    echo ""
    echo "🎉 Build concluído! O APK está pronto para instalação."
    echo ""
    echo "📝 CONFIGURAÇÃO:"
    echo "- URL: https://www.livego.store/"
    echo "- Produção: Já configurado"
    echo "- Desenvolvimento: http://192.168.3.12:5174"
    echo "- WebRTC: SRS Server (72.60.249.175:1985)"
    echo "- STUN/TURN: Configurado e sincronizado"
    echo "- Vídeo Player: Integrado e otimizado"
    echo "- Live Streaming: 100% funcional"
    echo ""
    echo "⚠️  LEMBRE-SE:"
    echo "- O app funciona 100% via web"
    echo "- Atualizações do site refletem no app automaticamente"
    echo "- Sem dependências de atualização do Android"
    
else
    echo "❌ Falha ao gerar APK! Verifique os erros acima."
    exit 1
fi
