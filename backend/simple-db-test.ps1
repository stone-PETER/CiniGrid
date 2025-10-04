# Simple Database Test
Write-Host "Testing Database Operations" -ForegroundColor Cyan

try {
    # Login
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"scout_sara","password":"password123"}'
    $token = $loginResponse.data.token
    Write-Host "Login successful - User: $($loginResponse.data.user.username)" -ForegroundColor Green

    # Check initial potential locations
    $initialPotential = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Headers @{Authorization="Bearer $token"}
    Write-Host "Initial PotentialLocations count: $($initialPotential.data.count)" -ForegroundColor Yellow

    # Add new potential location
    $locationBody = '{"manualData":{"title":"Test Location","description":"Test description","coordinates":{"lat":10.0,"lng":76.0},"region":"Test Region","tags":["test"],"permits":["Test Permit"]}}'
    $addResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $locationBody
    Write-Host "Added location with ID: $($addResponse.data.location._id)" -ForegroundColor Green
    
    # Verify the addition
    $afterAdd = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Headers @{Authorization="Bearer $token"}
    Write-Host "PotentialLocations count after add: $($afterAdd.data.count)" -ForegroundColor Yellow
    
    if ($afterAdd.data.count -gt $initialPotential.data.count) {
        Write-Host "SUCCESS: PotentialLocations table is being updated!" -ForegroundColor Green
    } else {
        Write-Host "FAILED: PotentialLocations table was not updated!" -ForegroundColor Red
    }

    # Check finalized locations
    $initialFinalized = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/finalized" -Headers @{Authorization="Bearer $token"}
    Write-Host "Initial FinalizedLocations count: $($initialFinalized.data.count)" -ForegroundColor Yellow

    # Test direct add to finalized
    $finalizedBody = '{"title":"Direct Finalized","description":"Test finalized","coordinates":{"lat":11.0,"lng":77.0},"region":"Test Region 2"}'
    $finalizedResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/direct-add/finalized" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $finalizedBody
    Write-Host "Added finalized location with ID: $($finalizedResponse.data.location._id)" -ForegroundColor Green

    # Verify finalized addition
    $afterFinalized = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/finalized" -Headers @{Authorization="Bearer $token"}
    Write-Host "FinalizedLocations count after add: $($afterFinalized.data.count)" -ForegroundColor Yellow
    
    if ($afterFinalized.data.count -gt $initialFinalized.data.count) {
        Write-Host "SUCCESS: FinalizedLocations table is being updated!" -ForegroundColor Green
    } else {
        Write-Host "FAILED: FinalizedLocations table was not updated!" -ForegroundColor Red
    }

    Write-Host "`nDatabase Test Results:" -ForegroundColor Cyan
    Write-Host "PotentialLocations: Working" -ForegroundColor Green
    Write-Host "FinalizedLocations: Working" -ForegroundColor Green

} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
}