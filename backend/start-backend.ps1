# PowerShell script to start backend server
Set-Location "C:\programs\CiniGrid\backend"
Write-Host "Starting backend server from: $(Get-Location)" -ForegroundColor Green
npm run dev
