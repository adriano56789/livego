# Script para configurar recursos do Android
Write-Host "Verificando e corrigindo problemas de diretórios..." -ForegroundColor Cyan

# Corrigir nome de diretório inválido (se existir)
$oldDir = "android\app\src\main\res\drawable-{mdpi"
$newDir = "android\app\src\main\res\drawable-mdpi"

if (Test-Path $oldDir) {
    # Verifica se o diretório de destino já existe
    if (Test-Path $newDir) {
        Write-Host "Atenção: O diretório $newDir já existe. Verifique manualmente." -ForegroundColor Yellow
    } else {
        try {
            Rename-Item -Path $oldDir -NewName "drawable-mdpi"
            Write-Host "✅ Diretório renomeado: $oldDir -> $newDir" -ForegroundColor Green
        } catch {
            Write-Host "Erro ao renomear diretório: $_" -ForegroundColor Red
        }
    }
}

Write-Host "`nConfigurando recursos do Android..." -ForegroundColor Cyan

# Cria pastas necessárias
$folders = @(
    "resources\android\icon",
    "resources\android\splash",
    "android\app\src\main\res\mipmap-hdpi",
    "android\app\src\main\res\mipmap-mdpi",
    "android\app\src\main\res\mipmap-xhdpi",
    "android\app\src\main\res\mipmap-xxhdpi",
    "android\app\src\main\res\mipmap-xxxhdpi",
    "android\app\src\main\res\drawable-hdpi",
    "android\app\src\main\res\drawable-mdpi",
    "android\app\src\main\res\drawable-xhdpi",
    "android\app\src\main\res\drawable-xxhdpi",
    "android\app\src\main\res\drawable-xxxhdpi"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
        Write-Host "Criada pasta: $folder" -ForegroundColor Green
    }
}

Write-Host "`nInstalando dependências..." -ForegroundColor Cyan
npm install -D @capacitor/assets

Write-Host "`nSincronizando projeto Android..." -ForegroundColor Cyan
npx cap sync android

Write-Host "`n✅ Configuração concluída!" -ForegroundColor Green
Write-Host "Adicione seus arquivos:" -ForegroundColor Yellow
Write-Host "- resources\android\icon\icon.png"
Write-Host "- resources\android\splash\splash.png"
Write-Host "`nDepois execute:" -ForegroundColor Yellow
Write-Host "npx capacitor-assets generate --android" -ForegroundColor Cyan
Write-Host "npx cap sync android" -ForegroundColor Cyan
