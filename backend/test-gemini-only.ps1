# Test Gemini-Only Location Generation
# This script runs the test suite for Gemini-only location generation
# No Google Places API required!

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     GEMINI-ONLY LOCATION GENERATION TEST                 ║" -ForegroundColor Cyan
Write-Host "║     (No Google Places API Required)                      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# Check if we're in the backend directory
if (-not (Test-Path ".\test-gemini-only.js")) {
    Write-Host "❌ Error: test-gemini-only.js not found!" -ForegroundColor Red
    Write-Host "Please run this script from the backend directory" -ForegroundColor Yellow
    exit 1
}

# Check for .env file
if (-not (Test-Path ".\.env")) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "Make sure GEMINI_API_KEY is set in your environment" -ForegroundColor Yellow
    Write-Host "`n"
}

Write-Host "🚀 Starting Gemini-Only test suite..." -ForegroundColor Green
Write-Host "`n"

# Run the test
node test-gemini-only.js

Write-Host "`n"
Write-Host "Test complete!" -ForegroundColor Green
Write-Host "`n"
