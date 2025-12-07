# Script para atualizar o WebView do Android com as alterações do web app
# Este script deve ser executado após fazer alterações no web app

# Parar no primeiro erro
$ErrorActionPreference = "Stop"

Write-Host "Iniciando processo de atualizacao do WebView..." -ForegroundColor Cyan

# 1. Construir o web app
Write-Host "Construindo o web app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao construir o web app" -ForegroundColor Red
    exit 1
}

# 2. Diretorios
$webDistDir = "$PWD\dist"
$androidAssetsDir = "$PWD\android\app\src\main\assets\public"

# 3. Criar diretorio de destino se não existir
if (-not (Test-Path $androidAssetsDir)) {
    New-Item -ItemType Directory -Path $androidAssetsDir -Force | Out-Null
}

# 4. Limpar diretorio de destino
Write-Host "Limpando diretorio de destino..." -ForegroundColor Yellow
Get-ChildItem -Path $androidAssetsDir -Exclude "sounds" | Remove-Item -Recurse -Force

# 5. Copiar arquivos
Write-Host "Copiando arquivos para o projeto Android..." -ForegroundColor Yellow
Copy-Item -Path "$webDistDir\*" -Destination $androidAssetsDir -Recurse -Force

# 6. Sincronizar com o projeto Android
Write-Host "Sincronizando com o projeto Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao sincronizar com o projeto Android" -ForegroundColor Red
    exit 1
}

Write-Host "Atualizacao do WebView concluida com sucesso!" -ForegroundColor Green
Write-Host "Reinicie o aplicativo Android para ver as alteracoes" -ForegroundColor Green
