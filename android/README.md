# Build APK - LiveGo Android

## Pré-requisitos

1. **Java JDK 11+** (não JRE)
   - Baixe em: https://adoptium.net/
   - Instale o JDK completo

2. **Android Studio** (opcional, mas recomendado)
   - Baixe em: https://developer.android.com/studio
   - Já vem com JDK incluído

## Como Gerar o APK

### Método 1: Script Automático (Recomendado)

```bash
# Entre na pasta android
cd android

# Execute o script de build
build-apk.bat
```

### Método 2: Manual

```bash
# Configure JAVA_HOME (se necessário)
set JAVA_HOME=C:\Program Files\Java\jdk-11

# Entre na pasta android  
cd android

# Build do APK
gradlew.bat assembleDebug
```

## Resultado

O APK será gerado em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Para Instalar

1. **Copie o APK** para seu celular
2. **Ative "Fontes desconhecidas"** nas configurações do Android
3. **Instale o APK** clicando no arquivo

## Configuração do App

O app está configurado para carregar:
- **Desenvolvimento**: `http://192.168.3.12:5174`
- **Produção**: Altere em `MainActivity.kt` linha 81

## Estrutura do Projeto

```
android/
├── build.gradle              # Configuração do projeto
├── app/
│   ├── build.gradle         # Configuração do app
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/livego/app/
│       │   └── MainActivity.kt
│       └── res/
│           ├── layout/
│           │   └── activity_main.xml
│           ├── values/
│           │   ├── strings.xml
│           │   ├── colors.xml
│           │   └── themes.xml
│           └── mipmap-*/      # Ícones do app
├── gradlew                   # Script Linux/Mac
├── gradlew.bat              # Script Windows
└── build-apk.bat            # Script de build automático
```

## Permissões do App

O app solicita as permissões necessárias para:
- Internet (carregar o app)
- Câmera (lives)
- Microfone (áudio)
- Armazenamento (mídias)

## Solução de Problemas

### "Java não encontrado"
- Instale o JDK em: https://adoptium.net/
- Use o script `build-apk.bat` que detecta automaticamente

### "Gradle falhou"
- Verifique se o JAVA_HOME está correto
- Execute `gradlew clean` antes do build

### "APK não instala"
- Ative "Fontes desconhecidas" no Android
- Verifique se o APK não está corrompido

## Fluxo Correto

1. **Desenvolvimento**: Faça mudanças no app web
2. **Build**: Execute `build-apk.bat` 
3. **APK Gerado**: Encontre em `app/build/outputs/apk/debug/`
4. **Instalação**: Copie e instale no celular

**IMPORTANTE**: O APK sempre sai da pasta padrão `android/app/build/outputs/apk/` - este é o fluxo oficial Android!
