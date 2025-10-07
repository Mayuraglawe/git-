# Keep the backend server running
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Py-Gram Backend Server (Auto-Restart)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will run on port 3001" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    try {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting server..." -ForegroundColor Green
        npx tsx server/start.ts
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Server exited with code $LASTEXITCODE" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Server stopped! Restarting in 3 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}
