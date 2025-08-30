# Start Backend Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'F:\DAIICT\blue_carbon_ecosystem\Blue_Carbon_Ecosystem-main\backend'; python test_simple.py"

# Wait a moment
Start-Sleep -Seconds 3

# Start Frontend Server  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'F:\DAIICT\blue_carbon_ecosystem\Blue_Carbon_Ecosystem-main\client'; npm start"

Write-Host "🚀 Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "Backend will be at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend will be at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Wait a few moments for them to fully start..." -ForegroundColor Yellow
