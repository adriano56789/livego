# Script para limpar a pasta de build do Android
# Uso: Execute como administrador

$buildDir = "C:\projetos\livego-2\android\app\build"

Write-Host "=== Limpando pasta de build do Android ===" -ForegroundColor Cyan

# Verifica se a pasta existe
if (Test-Path $buildDir) {
    Write-Host "Encontrada pasta de build em: $buildDir"
    
    # Tenta encerrar processos que podem estar travando os arquivos
    Write-Host "Verificando processos que podem estar travando os arquivos..."
    
    # Lista de processos que podem estar travando
    $processesToCheck = @("java", "javaw", "studio64", "adb")
    $processesFound = $false
    
    foreach ($processName in $processToCheck) {
        $procs = Get-Process -Name $processName -ErrorAction SilentlyContinue
        if ($procs) {
            $processesFound = $true
            Write-Host "Encontrado processo travando: $processName" -ForegroundColor Yellow
            $procs | Select-Object Id, ProcessName, Path
        }
    }
    
    if ($processesFound) {
        $answer = Read-Host "Deseja tentar encerrar esses processos? (S/N)"
        if ($answer -eq "S" -or $answer -eq "s") {
            foreach ($processName in $processToCheck) {
                Get-Process -Name $processName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 2
        }
    }
    
    # Tenta remover a pasta
    try {
        Write-Host "Removendo pasta de build..."
        Remove-Item -Path $buildDir -Recurse -Force -ErrorAction Stop
        Write-Host "Pasta de build removida com sucesso!" -ForegroundColor Green
        
        # Limpa o cache do Gradle
        Write-Host "Limpando cache do Gradle..."
        .\gradlew clean --no-daemon
        
    } catch {
        Write-Host "Erro ao remover a pasta de build: $_" -ForegroundColor Red
        Write-Host "Sugest￵es:" -ForegroundColor Yellow
        Write-Host "1. Feche o Android Studio"
        Write-Host "2. Feche o emulador ou desconecte dispositivos Android"
        Write-Host "3. Feche qualquer programa que possa estar usando a pasta"
        Write-Host "4. Tente executar este script como administrador"
        Write-Host "5. Se nada funcionar, reinicie o computador e tente novamente"
    }
} else {
    Write-Host "Pasta de build n￵o encontrada em: $buildDir" -ForegroundColor Green
}

Write-Host "=== Limpeza conclu�a ===" -ForegroundColor Cyan

# Mant�m o console aberto
Read-Host "Pressione Enter para sair"
