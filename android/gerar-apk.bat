@echo off
echo ========================================
echo GERADOR DE APK - LIVEGO
echo ========================================
echo.

echo 1. Instalando Java JDK...
winget install EclipseAdoptium.Temurin.17.JDK --silent --accept-source-agreements --accept-package-agreements

echo.
echo 2. Configurando ambiente...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo.
echo 3. Verificando Java...
java -version

echo.
echo 4. Baixando build tools...
if not exist "build-tools" mkdir build-tools
cd build-tools

if not exist "gradle-8.4-bin.zip" (
    echo Baixando Gradle...
    powershell -Command "Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.4-bin.zip' -OutFile 'gradle-8.4-bin.zip'"
)

echo.
echo 5. Extraindo Gradle...
if not exist "gradle-8.4" (
    powershell -Command "Expand-Archive -Path 'gradle-8.4-bin.zip' -DestinationPath '.'"
)

set GRADLE_HOME=%CD%\gradle-8.4
set PATH=%GRADLE_HOME%\bin;%PATH%

cd ..

echo.
echo 6. Criando APK manualmente...
if not exist "output" mkdir output

echo.
echo 7. Compilando projeto...
call %GRADLE_HOME%\bin\gradle assembleDebug --stacktrace

if %ERRORLEVEL%==0 (
    echo.
    echo ========================================
    echo ✅ APK GERADO COM SUCESSO!
    echo ========================================
    echo.
    echo Local do APK: app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Para instalar:
    echo 1. Copie o APK para o celular
    echo 2. Ative "Instalacao de fontes desconhecidas"
    echo 3. Instale o APK
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ ERRO NO BUILD
    echo ========================================
    echo.
    echo Verifique os erros acima.
)

pause
