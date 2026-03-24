@echo off
echo 🚀 Iniciando build do APK Web App...

REM Entrar na pasta do Android
cd android

REM Limpar builds anteriores
echo 🧹 Limpando builds anteriores...
call gradlew clean

REM Compilar versão de release
echo 📦 Compilando APK de release...
call gradlew assembleRelease

REM Verificar se APK foi gerado
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo ✅ APK gerado com sucesso!
    echo 📍 Local: android\app\build\outputs\apk\release\app-release.apk
    
    REM Mover para pasta de saída
    if not exist output mkdir output
    copy "app\build\outputs\apk\release\app-release.apk" "output\livego-webapp.apk"
    echo 📋 APK copiado para: android\output\livego-webapp.apk
    
    REM Mostrar informações
    dir "output\livego-webapp.apk"
    
    echo.
    echo 🎉 Build concluído! O APK está pronto para instalação.
    echo.
    echo 📝 CONFIGURAÇÃO:
    echo - URL: https://www.livego.store/
    echo - Produção: Já configurado
    echo - Desenvolvimento: http://192.168.3.12:5174
    echo - WebRTC: SRS Server (72.60.249.175:1985)
    echo - STUN/TURN: Configurado e sincronizado
    echo - Vídeo Player: Integrado e otimizado
    echo.
    echo ⚠️  LEMBRE-SE:
    echo - O app funciona 100%% via web
    echo - Atualizações do site refletem no app automaticamente
    echo - Sem dependências de atualização do Android
    
) else (
    echo ❌ Falha ao gerar APK! Verifique os erros acima.
    pause
    exit /b 1
)

pause
