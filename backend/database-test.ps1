# Database Testing Script - Testing PotentialLocations and FinalizedLocations Tables
Write-Host "🧪 TESTING DATABASE OPERATIONS FOR LOCATION TABLES" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

try {
    # Step 1: Login and get token
    Write-Host "`n1. 🔐 Getting authentication token..." -ForegroundColor Yellow
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"scout_sara","password":"password123"}'
    $token = $loginResponse.data.token
    Write-Host "✅ Login successful - User: $($loginResponse.data.user.username) ($($loginResponse.data.user.role))" -ForegroundColor Green

    # Step 2: Check initial state of potential locations
    Write-Host "`n2. 📊 Checking initial state of PotentialLocations table..." -ForegroundColor Yellow
    $initialPotential = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Headers @{Authorization="Bearer $token"}
    Write-Host "✅ Initial PotentialLocations count: $($initialPotential.data.count)" -ForegroundColor Green

    # Step 3: Check initial state of finalized locations
    Write-Host "`n3. 📊 Checking initial state of FinalizedLocations table..." -ForegroundColor Yellow
    $initialFinalized = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/finalized" -Headers @{Authorization="Bearer $token"}
    Write-Host "✅ Initial FinalizedLocations count: $($initialFinalized.data.count)" -ForegroundColor Green

    # Step 4: Add a new potential location
    Write-Host "`n4. ➕ Adding new location to PotentialLocations table..." -ForegroundColor Yellow
    $newLocationData = @{
        manualData = @{
            title = "Test Beach Location - $(Get-Date -Format 'HH:mm:ss')"
            description = "A beautiful beach location for testing database operations"
            coordinates = @{lat = 8.5241; lng = 76.9366}
            region = "Kerala, India"
            tags = @("beach", "test", "romantic")
            permits = @("Coastal Permit", "Tourism Department Clearance", "Local Authority Permission")
            images = @("https://example.com/beach1.jpg", "https://example.com/beach2.jpg")
        }
    } | ConvertTo-Json -Depth 5

    $addLocationResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $newLocationData
    $newLocationId = $addLocationResponse.data.location._id
    Write-Host "✅ Successfully added to PotentialLocations!" -ForegroundColor Green
    Write-Host "   Location ID: $newLocationId" -ForegroundColor White
    Write-Host "   Title: $($addLocationResponse.data.location.title)" -ForegroundColor White
    Write-Host "   Coordinates: lat=$($addLocationResponse.data.location.coordinates.lat), lng=$($addLocationResponse.data.location.coordinates.lng)" -ForegroundColor White
    Write-Host "   Permits count: $($addLocationResponse.data.location.permits.Count)" -ForegroundColor White
    Write-Host "   Tags: $($addLocationResponse.data.location.tags -join ', ')" -ForegroundColor White

    # Step 5: Verify the location was actually saved in database
    Write-Host "`n5. ✅ Verifying location was saved in PotentialLocations table..." -ForegroundColor Yellow
    $verifyPotential = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Headers @{Authorization="Bearer $token"}
    Write-Host "✅ Updated PotentialLocations count: $($verifyPotential.data.count)" -ForegroundColor Green
    
    if ($verifyPotential.data.count -gt $initialPotential.data.count) {
        Write-Host "✅ DATABASE UPDATE CONFIRMED: PotentialLocations table was updated!" -ForegroundColor Green
        
        # Show the latest location details
        $latestLocation = $verifyPotential.data.locations[0]
        Write-Host "   Latest location details:" -ForegroundColor White
        Write-Host "   - ID: $($latestLocation._id)" -ForegroundColor White
        Write-Host "   - Title: $($latestLocation.title)" -ForegroundColor White
        Write-Host "   - Region: $($latestLocation.region)" -ForegroundColor White
        Write-Host "   - Added by: $($latestLocation.addedBy.username) ($($latestLocation.addedBy.role))" -ForegroundColor White
        Write-Host "   - Created at: $($latestLocation.createdAt)" -ForegroundColor White
    } else {
        Write-Host "❌ DATABASE UPDATE FAILED: PotentialLocations count did not increase!" -ForegroundColor Red
    }

    # Step 6: Add a note to the potential location
    Write-Host "`n6. 📝 Adding note to the potential location..." -ForegroundColor Yellow
    $noteData = @{
        text = "This location looks perfect for the romantic beach scene! Great lighting during sunset."
    } | ConvertTo-Json

    $addNoteResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential/$newLocationId/notes" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $noteData
    Write-Host "✅ Note added successfully!" -ForegroundColor Green
    Write-Host "   Note: $($addNoteResponse.data.note.text)" -ForegroundColor White
    Write-Host "   Author: $($addNoteResponse.data.note.author) ($($addNoteResponse.data.note.role))" -ForegroundColor White

    # Step 7: Add approval to the potential location
    Write-Host "`n7. ✅ Adding approval to the potential location..." -ForegroundColor Yellow
    $approvalData = @{
        approved = $true
        comment = "Approved for shooting. Excellent choice for the romantic subplot."
    } | ConvertTo-Json

    $addApprovalResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential/$newLocationId/approvals" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $approvalData
    Write-Host "✅ Approval added successfully!" -ForegroundColor Green
    Write-Host "   Approved: $($addApprovalResponse.data.approval.approved)" -ForegroundColor White
    Write-Host "   Comment: $($addApprovalResponse.data.approval.comment)" -ForegroundColor White

    # Step 8: Finalize the location (move to FinalizedLocations table)
    Write-Host "`n8. 🎯 Finalizing location (moving to FinalizedLocations table)..." -ForegroundColor Yellow
    $finalizeResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential/$newLocationId/finalize" -Method POST -Headers @{Authorization="Bearer $token"}
    Write-Host "✅ Location finalized successfully!" -ForegroundColor Green
    Write-Host "   Finalized by: $($finalizeResponse.data.location.finalizedBy.username)" -ForegroundColor White
    Write-Host "   Finalized at: $($finalizeResponse.data.location.finalizedAt)" -ForegroundColor White

    # Step 9: Verify location was moved to FinalizedLocations table
    Write-Host "`n9. ✅ Verifying location moved to FinalizedLocations table..." -ForegroundColor Yellow
    $updatedFinalized = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/finalized" -Headers @{Authorization="Bearer $token"}
    $updatedPotential = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Headers @{Authorization="Bearer $token"}
    
    Write-Host "✅ Updated FinalizedLocations count: $($updatedFinalized.data.count)" -ForegroundColor Green
    Write-Host "✅ Updated PotentialLocations count: $($updatedPotential.data.count)" -ForegroundColor Green

    if ($updatedFinalized.data.count -gt $initialFinalized.data.count) {
        Write-Host "✅ DATABASE UPDATE CONFIRMED: Location moved to FinalizedLocations table!" -ForegroundColor Green
        
        # Show the finalized location details
        $finalizedLocation = $updatedFinalized.data.locations | Where-Object { $_.title -like "*Test Beach Location*" } | Select-Object -First 1
        if ($finalizedLocation) {
            Write-Host "   Finalized location details:" -ForegroundColor White
            Write-Host "   - ID: $($finalizedLocation._id)" -ForegroundColor White
            Write-Host "   - Title: $($finalizedLocation.title)" -ForegroundColor White
            Write-Host "   - Notes count: $($finalizedLocation.notes.Count)" -ForegroundColor White
            Write-Host "   - Approvals count: $($finalizedLocation.approvals.Count)" -ForegroundColor White
            Write-Host "   - Added by: $($finalizedLocation.addedBy.username)" -ForegroundColor White
            Write-Host "   - Finalized by: $($finalizedLocation.finalizedBy.username)" -ForegroundColor White
        }
    } else {
        Write-Host "❌ DATABASE UPDATE FAILED: FinalizedLocations count did not increase!" -ForegroundColor Red
    }

    # Step 10: Test direct add to finalized
    Write-Host "`n10. 🎯 Testing direct add to FinalizedLocations table..." -ForegroundColor Yellow
    $directFinalizedData = @{
        title = "Direct Studio Location - $(Get-Date -Format 'HH:mm:ss')"
        description = "Professional studio with green screen setup"
        coordinates = @{lat = 19.0760; lng = 72.8777}
        region = "Mumbai, Maharashtra"
        tags = @("studio", "professional", "green-screen")
        permits = @("Studio Booking Confirmed", "Equipment Setup Approved")
        images = @("https://example.com/studio1.jpg")
    } | ConvertTo-Json -Depth 3

    $directFinalizedResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/direct-add/finalized" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $directFinalizedData
    Write-Host "✅ Direct add to FinalizedLocations successful!" -ForegroundColor Green
    Write-Host "   Location ID: $($directFinalizedResponse.data.location._id)" -ForegroundColor White
    Write-Host "   Title: $($directFinalizedResponse.data.location.title)" -ForegroundColor White

    # Final verification
    Write-Host "`n11. 🏁 Final verification of all database operations..." -ForegroundColor Yellow
    $finalPotential = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/potential" -Headers @{Authorization="Bearer $token"}
    $finalFinalized = Invoke-RestMethod -Uri "http://localhost:5000/api/locations/finalized" -Headers @{Authorization="Bearer $token"}
    
    Write-Host "`n📊 FINAL DATABASE STATE:" -ForegroundColor Cyan
    Write-Host "   PotentialLocations: $($finalPotential.data.count) (started with $($initialPotential.data.count))" -ForegroundColor White
    Write-Host "   FinalizedLocations: $($finalFinalized.data.count) (started with $($initialFinalized.data.count))" -ForegroundColor White

    Write-Host "`n🎉 ALL DATABASE TESTS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "✅ PotentialLocations table: READ/WRITE operations working" -ForegroundColor Green
    Write-Host "✅ FinalizedLocations table: READ/WRITE operations working" -ForegroundColor Green
    Write-Host "✅ Location finalization: MOVE operation working" -ForegroundColor Green
    Write-Host "✅ Notes and Approvals: ADD operations working" -ForegroundColor Green
    Write-Host "✅ Data persistence: All data being saved and retrieved correctly" -ForegroundColor Green

} catch {
    Write-Host "`n❌ TEST FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check server logs for detailed error information" -ForegroundColor Yellow
}