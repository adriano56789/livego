# Script para configurar o ambiente Android
# Execute como administrador para garantir que as variáveis sejam definidas corretamente

# Verifica se o script está sendo executado como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Este script requer privilégios de administrador. Por favor, execute como administrador." -ForegroundColor Red
    exit 1
}

# Configura as variáveis de ambiente do sistema
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"

# Verifica se o diretório do Android SDK existe
if (-not (Test-Path $androidSdkPath)) {
    Write-Host "Android SDK não encontrado em: $androidSdkPath" -ForegroundColor Red
    Write-Host "Por favor, instale o Android Studio e o Android SDK primeiro." -ForegroundColor Yellow
    exit 1
}

# Define as variáveis de ambiente do sistema
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidSdkPath, [System.EnvironmentVariableTarget]::Machine)

# Atualiza o PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::Machine)
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

[System.Environment]::SetEnvironmentVariable('Path', $currentPath, [System.EnvironmentVariableTarget]::Machine)

# Exibe as configurações
Write-Host ""
Write-Host "=== Configuração do Ambiente Android ===" -ForegroundColor Green
Write-Host "ANDROID_HOME: $androidSdkPath"
Write-Host "Path atualizado com sucesso!"
Write-Host ""
Write-Host "Para que as alterações tenham efeito, por favor, reinicie o terminal ou o computador." -ForegroundColor Yellow
Write-Host ""

# Verifica se o Android Studio está instalado
$androidStudioPath = "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe"
if (Test-Path $androidStudioPath) {
    Write-Host "Deseja abrir o Android Studio agora? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq 'S' -or $response -eq 's') {
        Start-Process $androidStudioPath
    }
} else {
    Write-Host "Android Studio não encontrado em: $androidStudioPath" -ForegroundColor Yellow
}
