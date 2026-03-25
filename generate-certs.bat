@echo off
echo Gerando certificados auto-assinados para TURN server...

:: Verificar se OpenSSL está disponível
where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo OpenSSL não encontrado. Instale OpenSSL ou use Git Bash.
    echo Tentando usar OpenSSL do Git Bash...
    
    :: Tentar usar OpenSSL do Git Bash
    "C:\Program Files\Git\usr\bin\openssl.exe" req -x509 -newkey rsa:2048 -keyout "turn_server_pkey.pem" -out "turn_server_cert.pem" -days 365 -nodes -subj "/C=BR/ST=SP/L=Sao Paulo/O=LiveGo/OU=WebRTC/CN=livego.store"
    
    if %errorlevel% neq 0 (
        echo Falha ao gerar certificados. Por favor, instale OpenSSL manualmente.
        pause
        exit /b 1
    )
) else (
    :: Usar OpenSSL do sistema
    openssl req -x509 -newkey rsa:2048 -keyout "turn_server_pkey.pem" -out "turn_server_cert.pem" -days 365 -nodes -subj "/C=BR/ST=SP/L=Sao Paulo/O=LiveGo/OU=WebRTC/CN=livego.store"
)

echo Certificados gerados com sucesso!
echo Arquivos criados:
echo - turn_server_cert.pem (certificado)
echo - turn_server_pkey.pem (chave privada)
pause
