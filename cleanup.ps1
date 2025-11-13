# Kill any processes using port 3000 or 24678
$ports = @(3000, 24678, 24679)

foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        $process | ForEach-Object { 
            Stop-Process -Id $_.OwningProcess -Force
            Write-Host "Killed process $($_.OwningProcess) on port $port"
        }
    } else {
        Write-Host "No process found on port $port"
    }
}

# Remove Vite cache
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "Removed Vite cache"
}

# Install dependencies if needed
# npm install

# Start the development server
Write-Host "`nStarting development server..."
npm run dev
