#!/bin/bash

echo "========================================"
echo "GERADOR DE APK - LIVEGO"
echo "========================================"
echo

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Verificar/Instalar Java
echo "1. Verificando Java..."
if ! command_exists java; then
    echo "Java não encontrado. Instalando..."
    if command_exists brew; then
        brew install openjdk@17
    elif command_exists apt; then
        sudo apt update
        sudo apt install openjdk-17-jdk -y
    else
        echo "Por favor, instale Java JDK 17 manualmente"
        exit 1
    fi
fi

java -version

# 2. Configurar variáveis de ambiente
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export PATH=$JAVA_HOME/bin:$PATH

# 3. Baixar Gradle se necessário
echo "2. Verificando Gradle..."
if ! command_exists gradle; then
    echo "Baixando Gradle..."
    mkdir -p ~/gradle
    cd ~/gradle
    
    if [ ! -f "gradle-8.4-bin.zip" ]; then
        wget https://services.gradle.org/distributions/gradle-8.4-bin.zip
    fi
    
    if [ ! -d "gradle-8.4" ]; then
        unzip gradle-8.4-bin.zip
    fi
    
    export GRADLE_HOME=~/gradle/gradle-8.4
    export PATH=$GRADLE_HOME/bin:$PATH
    cd -
fi

gradle --version

# 4. Executar build
echo "3. Gerando APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo
    echo "========================================"
    echo "✅ APK GERADO COM SUCESSO!"
    echo "========================================"
    echo
    echo "Local do APK: app/build/outputs/apk/debug/app-debug.apk"
    echo
    echo "Para instalar:"
    echo "1. Copie o APK para o celular"
    echo "2. Ative 'Instalação de fontes desconhecidas'"
    echo "3. Instale o APK"
    echo
else
    echo
    echo "========================================"
    echo "❌ ERRO NO BUILD"
    echo "========================================"
fi
