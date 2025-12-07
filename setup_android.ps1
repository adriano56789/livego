# Script para configurar o ambiente Android (Modificado para Escopo de Usuário)
# Não requer administrador

# Configura as variáveis de ambiente do sistema
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"

# Verifica se o diretório do Android SDK existe
if (-not (Test-Path $androidSdkPath)) {
    Write-Host "Android SDK não encontrado em: $androidSdkPath" -ForegroundColor Red
    Write-Host "Por favor, instale o Android Studio e o Android SDK primeiro." -ForegroundColor Yellow
    exit 1
}

# Define as variáveis de ambiente (Escopo do Usuário)
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidSdkPath, [System.EnvironmentVariableTarget]::User)
Write-Host "ANDROID_HOME definido para: $androidSdkPath"

# Atualiza o PATH (Escopo do Usuário)
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::User)
$pathsToAdd = @(
    "$androidSdkPath\platform-tools",
    "$androidSdkPath\emulator",
    "$androidSdkPath\cmdline-tools\latest\bin"
)

foreach ($path in $pathsToAdd) {
    if ($currentPath -notlike "*$path*") {
        $currentPath = "$path;" + $currentPath
    }
}

[System.Environment]::SetEnvironmentVariable('Path', $currentPath, [System.EnvironmentVariableTarget]::User)

# Exibe as configurações
Write-Host ""
Write-Host "=== Configuração do Ambiente Android (Usuário) ===" -ForegroundColor Green
Write-Host "ANDROID_HOME: $androidSdkPath"
Write-Host "Path atualizado com sucesso!"
Write-Host ""
Write-Host "Para que as alterações tenham efeito, por favor, reinicie o terminal." -ForegroundColor Yellow
Write-Host ""

# Verifica se o Android Studio está instalado
$androidStudioPath = "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe"
if (Test-Path $androidStudioPath) {
    Write-Host "Deseja abrir o Android Studio agora? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq 'S' -or $response -eq 's') {
        Start-Process $androidStudioPath
    }
}
else {
    Write-Host "Android Studio não encontrado em: $androidStudioPath" -ForegroundColor Yellow
}
