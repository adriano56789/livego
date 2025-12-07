# Update Android WebView Script
# This script builds the web app and updates the Android WebView

# Stop on first error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting build and update process..." -ForegroundColor Cyan

# 1. Build the web app
Write-Host "🔨 Building web app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# 2. Sync with Android project
Write-Host "🔄 Syncing with Android project..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to sync with Android project" -ForegroundColor Red
    exit 1
}

# 3. Run on connected device/emulator
Write-Host "🚀 Launching app on Android..." -ForegroundColor Green
Write-Host "   (If no device is connected, this will fail)" -ForegroundColor Gray
npx cap run android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to launch app on Android" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build and update completed successfully!" -ForegroundColor Green
