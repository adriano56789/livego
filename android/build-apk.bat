@echo off
echo Verificando Java...

REM Tenta encontrar Java em locais comuns
set JAVA_HOME=
set FOUND_JAVA=0

REM Verifica JAVA_HOME já existente
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        echo Java encontrado em: %JAVA_HOME%
        set FOUND_JAVA=1
    )
)

REM Se não encontrou, busca em locais padrão
if %FOUND_JAVA%==0 (
    echo Procurando Java em locais padrão...
    
    REM Android Studio JDK
    if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
        set FOUND_JAVA=1
        echo Java encontrado no Android Studio
    )
    
    REM Java padrão
    if %FOUND_JAVA%==0 (
        for /d %%i in ("C:\Program Files\Java\jdk*") do (
            if exist "%%i\bin\java.exe" (
                set "JAVA_HOME=%%i"
                set FOUND_JAVA=1
                echo Java encontrado em: %%i
                goto :found
            )
        )
    )
)

:found
if %FOUND_JAVA%==0 (
    echo.
    echo ERRO: Java nao encontrado!
    echo.
    echo Por favor, instale o Java JDK 11 ou superior:
    echo 1. Baixe em: https://adoptium.net/
    echo 2. Instale o JDK (nao o JRE)
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo.
echo JAVA_HOME configurado: %JAVA_HOME%
echo.

REM Adiciona Java ao PATH temporariamente
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Verificando versao do Java...
java -version

echo.
echo Iniciando build do APK...
echo.

REM Executa o build
call gradlew.bat assembleDebug

if %ERRORLEVEL%==0 (
    echo.
    echo BUILD SUCESSO!
    echo.
    echo APK gerado em: app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Para instalar:
    echo 1. Copie o APK para seu celular
    echo 2. Ative "Instalacao de fontes desconhecidas" nas configuracoes
    echo 3. Instale o APK
    echo.
) else (
    echo.
    echo ERRO NO BUILD!
    echo Verifique os erros acima.
)

pause
