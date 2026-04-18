#!/usr/bin/env pwsh

$vpsHost = "72.60.249.175"
$user = "root"
$password = "kdW3k&Fr'+9u62uD"

Write-Host "Conectando à VPS..."
ssh -o StrictHostKeyChecking=no $user@$vpsHost "echo 'Conexão estabelecida com sucesso!' && pwd && ls -la && echo '=== Verificando Docker ===' && docker ps -a"
