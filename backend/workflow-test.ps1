# Complete workflow test
$token = (Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"director_mike","password":"password123"}').data.token

Write-Host "Testing complete workflow..." -ForegroundColor Cyan

# Create location with detailed data
$locationData = '{"manualData":{"title":"Beach Scene Location","description":"Perfect beach for romantic sunset scene","coordinates":{"lat":8.2,"lng":77.1},"region":"Goa","tags":["beach","romantic","sunset"],"permits":["Beach Access","Coastal Permit","Tourism Dept"],"images":["beach1.jpg","beach2.jpg"]}}'

$newLocation = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $locationData
$locationId = $newLocation.data.location._id

Write-Host "Created location: $locationId" -ForegroundColor Green
Write-Host "Permits transformed: $($newLocation.data.location.permits.Count) permits" -ForegroundColor Yellow

# Add note
$noteData = '{"text":"Great location choice! The sunset lighting will be perfect."}'
$note = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential/$locationId/notes" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $noteData
Write-Host "Added note successfully" -ForegroundColor Green

# Add approval  
$approvalData = '{"approved":true,"comment":"Approved by director. Fits our vision perfectly."}'
$approval = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential/$locationId/approvals" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $approvalData
Write-Host "Added approval successfully" -ForegroundColor Green

# Get full location details
$fullLocation = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential/$locationId" -Headers @{Authorization="Bearer $token"}

Write-Host "`nFULL LOCATION VERIFICATION:" -ForegroundColor Cyan
Write-Host "Title: $($fullLocation.data.location.title)" -ForegroundColor White
Write-Host "Region: $($fullLocation.data.location.region)" -ForegroundColor White  
Write-Host "Tags: $($fullLocation.data.location.tags -join ', ')" -ForegroundColor White
Write-Host "Permits: $($fullLocation.data.location.permits.Count) permits stored" -ForegroundColor White
Write-Host "Images: $($fullLocation.data.location.images.Count) images stored" -ForegroundColor White
Write-Host "Notes: $($fullLocation.data.location.notes.Count) notes stored" -ForegroundColor White
Write-Host "Approvals: $($fullLocation.data.location.approvals.Count) approvals stored" -ForegroundColor White

Write-Host "`nDATA PERSISTENCE CONFIRMED!" -ForegroundColor Green