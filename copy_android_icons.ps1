# Caminhos de origem e destino
$sourceDir = "C:\projetos\livego-5\resources\android\icon\AppIcons (1)\android"
$targetDir = "C:\projetos\livego-5\android\app\src\main\res"

# Verifica se o diretório de destino existe, se não, cria
if (-not (Test-Path -Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
}

# Copia as pastas mipmap-* para o diretório de destino
Get-ChildItem -Path $sourceDir -Directory | ForEach-Object {
    $folderName = $_.Name
    $sourcePath = $_.FullName
    $targetPath = Join-Path -Path $targetDir -ChildPath $folderName
    
    # Cria o diretório de destino se não existir
    if (-not (Test-Path -Path $targetPath)) {
        New-Item -ItemType Directory -Path $targetPath -Force
    }
    
    # Copia os arquivos .png
    Get-ChildItem -Path $sourcePath -Filter "*.png" | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $targetPath -Force
        Write-Host "Copiado: $($_.Name) para $targetPath"
    }
}

Write-Host "`nCópia concluída!`n"

# Limpa e reconstrói o projeto
Write-Host "Limpando e reconstruindo o projeto..."
Set-Location -Path "C:\projetos\livego-5\android"
.\gradlew clean
Set-Location -Path "C:\projetos\livego-5"
npx cap sync android

Write-Host "`nProcesso concluído! Por favor, reconstrua o projeto no Android Studio."
