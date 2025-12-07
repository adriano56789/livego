# Caminho de origem
$sourcePath = "C:\Users\adria\OneDrive\Documentos\Área de Trabalho\ic_launcher"

# Caminhos de destino
$iconDest = "resources\android\icon"
$splashDest = "resources\android\splash"

# Criar pastas de destino se não existirem
if (-not (Test-Path $iconDest)) { New-Item -ItemType Directory -Force -Path $iconDest | Out-Null }
if (-not (Test-Path $splashDest)) { New-Item -ItemType Directory -Force -Path $splashDest | Out-Null }

# Procurar e copiar ícone
$iconFile = Get-ChildItem -Path $sourcePath -Filter "*icon*.png" | Select-Object -First 1
if ($iconFile) {
    Copy-Item -Path $iconFile.FullName -Destination "$iconDest\icon.png" -Force
    Write-Host "Ícone copiado: $($iconFile.Name) -> $iconDest\icon.png" -ForegroundColor Green
} else {
    Write-Host "Nenhum arquivo de ícone encontrado em $sourcePath" -ForegroundColor Yellow
}

# Procurar e copiar splash
$splashFile = Get-ChildItem -Path $sourcePath -Filter "*splash*.png" | Select-Object -First 1
if ($splashFile) {
    Copy-Item -Path $splashFile.FullName -Destination "$splashDest\splash.png" -Force
    Write-Host "Splash copiado: $($splashFile.Name) -> $splashDest\splash.png" -ForegroundColor Green
} else {
    Write-Host "Nenhum arquivo de splash encontrado em $sourcePath" -ForegroundColor Yellow
}

# Gerar recursos e sincronizar
Write-Host "`nGerando recursos do Android..." -ForegroundColor Cyan
npx capacitor-assets generate --android
npx cap sync android

Write-Host "`n✅ Processo concluído!" -ForegroundColor Green
