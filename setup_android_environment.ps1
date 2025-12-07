# Script para configurar variáveis de ambiente do Android Studio no Windows
# Autor: LiveGo Development Team
# Versão: 1.0

Write-Host "=== CONFIGURADOR DE AMBIENTE ANDROID STUDIO ===" -ForegroundColor Cyan
Write-Host "Analisando e configurando variáveis de ambiente..." -ForegroundColor Yellow

# Função para verificar se uma variável já existe
function Test-EnvironmentVariable {
    param([string]$Name)
    $userValue = [System.Environment]::GetEnvironmentVariable($Name, "User")
    $machineValue = [System.Environment]::GetEnvironmentVariable($Name, "Machine")
    return ($null -ne $userValue) -or ($null -ne $machineValue)
}

# Função para adicionar variável de ambiente (nível usuário)
function Set-EnvironmentVariableSafe {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Scope = "User"
    )
    
    if (-not (Test-EnvironmentVariable $Name)) {
        Write-Host "Criando variável: $Name" -ForegroundColor Green
        [System.Environment]::SetEnvironmentVariable($Name, $Value, $Scope)
    } else {
        $currentValue = [System.Environment]::GetEnvironmentVariable($Name, "User")
        if ($null -ne $currentValue -and $currentValue -ne $Value) {
            Write-Host "Atualizando variável: $Name" -ForegroundColor Yellow
            [System.Environment]::SetEnvironmentVariable($Name, $Value, $Scope)
        } else {
            Write-Host "Variável já existe: $Name" -ForegroundColor Gray
        }
    }
}

# Detectar caminhos comuns do Android Studio
$androidStudioPaths = @(
    "${env:LOCALAPPDATA}\Android\Sdk",
    "${env:ProgramFiles}\Android\Android Studio",
    "${env:ProgramFiles(x86)}\Android\Android Studio",
    "C:\Android\Sdk",
    "C:\Android\Android Studio"
)

# Encontrar o SDK do Android
$androidSdkPath = $null
foreach ($path in $androidStudioPaths) {
    if (Test-Path "$path\platform-tools") {
        $androidSdkPath = $path
        break
    }
}

if ($androidSdkPath) {
    Write-Host "SDK Android encontrado em: $androidSdkPath" -ForegroundColor Green
    
    # Configurar ANDROID_HOME
    Set-EnvironmentVariableSafe "ANDROID_HOME" $androidSdkPath
    
    # Configurar ANDROID_SDK_ROOT (alternativa moderna)
    Set-EnvironmentVariableSafe "ANDROID_SDK_ROOT" $androidSdkPath
    
    # Adicionar ferramentas ao PATH
    $pathsToAdd = @(
        "$androidSdkPath\platform-tools",
        "$androidSdkPath\tools",
        "$androidSdkPath\tools\bin",
        "$androidSdkPath\build-tools"
    )
    
    # Obter PATH atual do usuário
    $currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $pathArray = $currentPath -split ';'
    
    foreach ($toolPath in $pathsToAdd) {
        if (Test-Path $toolPath) {
            if ($toolPath -notin $pathArray) {
                Write-Host "Adicionando ao PATH: $toolPath" -ForegroundColor Green
                $newPath = $currentPath + ";" + $toolPath
                [System.Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
                $currentPath = $newPath
                $pathArray = $newPath -split ';'
            } else {
                Write-Host "PATH já contém: $toolPath" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "AVISO: SDK Android não encontrado em locais padrão!" -ForegroundColor Red
    Write-Host "Por favor, instale o Android Studio ou especifique o caminho manualmente." -ForegroundColor Red
}

# Configurar JAVA_HOME (tentar detectar automaticamente Java 17)
$javaPaths = @(
    "${env:ProgramFiles}\Java",
    "${env:ProgramFiles(x86)}\Java",
    "${env:LOCALAPPDATA}\Programs\AdoptOpenJDK",
    "${env:LOCALAPPDATA}\Programs\Eclipse Adoptium",
    "${env:LOCALAPPDATA}\Programs\Microsoft\jdk",
    "${env:ProgramFiles}\Microsoft\jdk"
)

$javaHome = $null
$java17Found = $false

foreach ($javaPath in $javaPaths) {
    if (Test-Path $javaPath) {
        $jdkFolders = Get-ChildItem $javaPath -Directory | Where-Object { $_.Name -like "jdk*" -or $_.Name -like "java*" }
        
        foreach ($jdkFolder in $jdkFolders) {
            # Verificar se é Java 17
            $releaseFile = "$($jdkFolder.FullName)\release"
            if (Test-Path $releaseFile) {
                $releaseContent = Get-Content $releaseFile
                if ($releaseContent -match "JAVA_VERSION=.*17.*") {
                    $javaHome = $jdkFolder.FullName
                    $java17Found = $true
                    Write-Host "Java 17 encontrado: $($jdkFolder.Name)" -ForegroundColor Green
                    break
                }
            }
            
            # Verificar via java -version
            $javaExe = "$($jdkFolder.FullName)\bin\java.exe"
            if (Test-Path $javaExe) {
                try {
                    $versionOutput = & $javaExe -version 2>&1
                    if ($versionOutput -match "17\.") {
                        $javaHome = $jdkFolder.FullName
                        $java17Found = $true
                        Write-Host "Java 17 detectado: $($jdkFolder.Name)" -ForegroundColor Green
                        break
                    }
                } catch {
                    # Ignorar erros ao verificar versão
                }
            }
        }
        
        if ($java17Found) { break }
    }
}

# Se não encontrou Java 17, tentar instalar ou baixar
if (-not $javaHome) {
    Write-Host "Java 17 não encontrado. Verificando instalações disponíveis..." -ForegroundColor Yellow
    
    # Usar o primeiro JDK disponível como fallback
    foreach ($javaPath in $javaPaths) {
        if (Test-Path $javaPath) {
            $jdkFolders = Get-ChildItem $javaPath -Directory | Where-Object { $_.Name -like "jdk*" -or $_.Name -like "java*" }
            if ($jdkFolders) {
                $javaHome = $jdkFolders[0].FullName
                Write-Host "Usando JDK disponível como fallback: $($jdkFolders[0].Name)" -ForegroundColor Yellow
                break
            }
        }
    }
    
    if (-not $javaHome) {
        Write-Host "ERRO: Nenhum Java JDK encontrado!" -ForegroundColor Red
        Write-Host "Por favor, instale o Java JDK 17 para desenvolvimento Android." -ForegroundColor Red
        Write-Host "Download: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Yellow
        Write-Host "" -ForegroundColor White
        Write-Host "Opções de instalação:" -ForegroundColor Cyan
        Write-Host "1. Baixe manualmente do link acima" -ForegroundColor White
        Write-Host "2. Use winget: winget install EclipseAdoptium.Temurin.17.JDK" -ForegroundColor White
        Write-Host "3. Use chocolatey: choco install temurin17jdk" -ForegroundColor White
    }
}

if ($javaHome) { 
    Write-Host "Java configurado em: $javaHome" -ForegroundColor Green
    Set-EnvironmentVariableSafe "JAVA_HOME" $javaHome
    
    # Adicionar Java ao PATH
    $javaBinPath = "$javaHome\bin"
    $currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $pathArray = $currentPath -split ';'
    
    if ($javaBinPath -notin $pathArray) {
        Write-Host "Adicionando Java ao PATH: $javaBinPath" -ForegroundColor Green
        $newPath = $currentPath + ";" + $javaBinPath
        [System.Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    }
    
    # Verificar versão do Java
    try {
        $javaExe = "$javaHome\bin\java.exe"
        if (Test-Path $javaExe) {
            $versionOutput = & $javaExe -version 2>&1
            Write-Host "Versão Java: $($versionOutput[0])" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "Não foi possível verificar a versão do Java" -ForegroundColor Yellow
    }
}

# Configurar variáveis adicionais úteis
Set-EnvironmentVariableSafe "GRADLE_USER_HOME" "${env:USERPROFILE}\.gradle"

# Verificar versão do Gradle
Write-Host "`n=== VERIFICANDO VERSÃO DO GRADLE ===" -ForegroundColor Cyan
$gradleWrapperPath = "${env:USERPROFILE}\gradle\bin\gradle.bat"
if (Test-Path $gradleWrapperPath) {
    try {
        $gradleVersion = & $gradleWrapperPath --version 2>$null
        Write-Host "Gradle encontrado:" -ForegroundColor Green
        $gradleVersion | Select-Object -First 3 | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    } catch {
        Write-Host "Erro ao verificar versão do Gradle" -ForegroundColor Yellow
    }
} else {
    # Tentar usar gradle wrapper do projeto
    $projectGradlePath = ".\gradlew.bat"
    if (Test-Path $projectGradlePath) {
        try {
            Write-Host "Verificando Gradle Wrapper do projeto..." -ForegroundColor Yellow
            $gradleVersion = & $projectGradlePath --version 2>$null
            Write-Host "Gradle Wrapper:" -ForegroundColor Green
            $gradleVersion | Select-Object -First 3 | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
        } catch {
            Write-Host "Gradle Wrapper não encontrado ou com erro" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Gradle não encontrado no sistema" -ForegroundColor Yellow
        Write-Host "Recomendado instalar Gradle ou usar o wrapper do projeto" -ForegroundColor Yellow
    }
}

# Verificar instalação do Git
$gitPath = where.exe git 2>$null
if ($gitPath) {
    Write-Host "Git encontrado: $gitPath" -ForegroundColor Green
} else {
    Write-Host "AVISO: Git não encontrado no PATH!" -ForegroundColor Yellow
    Write-Host "Recomendado instalar Git para desenvolvimento." -ForegroundColor Yellow
}

# Resumo das variáveis configuradas
Write-Host "`n=== RESUMO DAS VARIÁVEIS CONFIGURADAS ===" -ForegroundColor Cyan
$envVars = @("ANDROID_HOME", "ANDROID_SDK_ROOT", "JAVA_HOME", "GRADLE_USER_HOME")

foreach ($var in $envVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var, "User")
    if ($value) {
        Write-Host "$var = $value" -ForegroundColor White
    } else {
        Write-Host "$var = (não configurado)" -ForegroundColor Red
    }
}

Write-Host "`n=== PRÓXIMOS PASSOS ===" -ForegroundColor Cyan
Write-Host "1. Feche e reabra o terminal PowerShell" -ForegroundColor Yellow
Write-Host "2. Reinicie o Android Studio se estiver aberto" -ForegroundColor Yellow
Write-Host "3. Execute 'flutter doctor' para verificar a configuração" -ForegroundColor Yellow
Write-Host "4. Execute 'adb devices' para testar a conexão Android" -ForegroundColor Yellow

Write-Host "`nConfiguração concluída!" -ForegroundColor Green
Write-Host "Pressione Enter para sair..." -ForegroundColor Cyan
Read-Host
