@echo off
title GERADOR APK LIVEGO - MODO SIMPLES
color 0A

echo ========================================
echo GERADOR DE APK LIVEGO - MODO SIMPLES
echo ========================================
echo.

echo [1/5] Configurando ambiente...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set ANDROID_HOME=C:\Users\adria\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%

echo [2/5] Limpando build anterior...
rmdir /s /q app\build 2>nul
rmdir /s /q .gradle 2>nul

echo [3/5] Iniciando Gradle Daemon...
start /B gradlew.bat --stop
timeout /t 5 /nobreak >nul

echo [4/5] Compilando APK...
gradlew.bat assembleDebug --info --stacktrace

echo [5/5] Verificando resultado...
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ========================================
    echo ✅ SUCESSO! APK GERADO!
    echo ========================================
    echo.
    echo 📁 Local: app\build\outputs\apk\debug\app-debug.apk
    echo 📊 Tamanho: 
    dir "app\build\outputs\apk\debug\app-debug.apk" | findstr app-debug.apk
    echo.
    echo 📱 Para instalar:
    echo    1. Copie o APK para seu celular
    echo    2. Ative "Fontes desconhecidas"
    echo    3. Instale o APK
    echo.
    echo 🚀 Abrindo pasta do APK...
    explorer "app\build\outputs\apk\debug"
) else (
    echo.
    echo ========================================
    echo ❌ FALHA NO BUILD
    echo ========================================
    echo Verifique os erros acima.
)

echo.
pause
