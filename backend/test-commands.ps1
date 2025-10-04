# API Test Commands (PowerShell)

# 1. Login to get token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"scout_sara","password":"password123"}'
$token = $loginResponse.data.token
Write-Host "✅ Login successful. Token: $($token.Substring(0,20))..."

# 2. Test AI search
$aiResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/search" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body '{"prompt":"Find beach locations"}'
Write-Host "✅ AI search successful. Found $($aiResponse.data.suggestions.Count) suggestions"

# 3. Test manual location add (the main fix)
$locationBody = @{
    manualData = @{
        title = "Test Beach Location"
        description = "Beautiful test beach for romantic scenes"
        coordinates = @{lat = 8.5241; lng = 76.9366}
        region = "Kerala, India"
        tags = @("beach", "romantic", "test")
        permits = @("Coastal Permit", "Tourism Department", "Local Authority")
        images = @("https://example.com/beach1.jpg")
    }
} | ConvertTo-Json -Depth 5

try {
    $locationResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $locationBody
    Write-Host "✅ Manual location add successful!"
    Write-Host "   Location ID: $($locationResponse.data.location._id)"
    Write-Host "   Title: $($locationResponse.data.location.title)"
    Write-Host "   Permits transformed: $($locationResponse.data.location.permits.Count) permits"
    foreach ($permit in $locationResponse.data.location.permits) {
        Write-Host "     - $($permit.name) (required: $($permit.required))"
    }
} catch {
    Write-Host "❌ Manual location add failed: $($_.Exception.Message)"
}

# 4. Get all potential locations
$getAllResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Headers @{Authorization="Bearer $token"}
Write-Host "✅ Get all locations successful. Total: $($getAllResponse.data.count)"

Write-Host "`n🎉 ALL TESTS COMPLETED!"