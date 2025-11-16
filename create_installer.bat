@echo off
REM Script para construir o aplicativo e gerar o instalador

echo Construindo o aplicativo...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Erro ao construir o aplicativo. Verifique os logs acima.
    pause
    exit /b %ERRORLEVEL%
)

echo Construindo o instalador...
call npx electron-builder build --win --x64

if %ERRORLEVEL% NEQ 0 (
    echo Erro ao construir o instalador. Verifique os logs acima.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Instalador gerado com sucesso!
echo Local: %CD%\release\LiveGo-Setup.exe
echo.
pause
