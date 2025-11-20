# build_and_run.ps1
Write-Host "Limpando build anterior..." -ForegroundColor Cyan
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
Write-Host "Construindo o aplicativo..." -ForegroundColor Cyan
npm run build

Write-Host "Sincronizando com o Android..." -ForegroundColor Cyan
npx cap sync android

Write-Host "Iniciando o aplicativo no emulador..." -ForegroundColor Cyan
npx cap run android
