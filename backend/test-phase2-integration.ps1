# Phase 2 Integration Test Runner
# Tests complete project-scoped workflow

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host "Phase 2 Integration Test Suite" -ForegroundColor Cyan
Write-Host "===========================================================`n" -ForegroundColor Cyan

# Check if backend is running
Write-Host "Checking if backend is running..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running on http://localhost:5000" -ForegroundColor Red
    Write-Host "   Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "   cd backend && npm run dev`n" -ForegroundColor Yellow
    exit 1
}

# Run the integration test
Write-Host "Starting integration tests...`n" -ForegroundColor Yellow

node test-phase2-integration.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n===========================================================" -ForegroundColor Green
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host "===========================================================`n" -ForegroundColor Green
} else {
    Write-Host "`n===========================================================" -ForegroundColor Red
    Write-Host "❌ Tests failed!" -ForegroundColor Red
    Write-Host "===========================================================`n" -ForegroundColor Red
    exit 1
}
