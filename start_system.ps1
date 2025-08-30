# Start AI-Powered Green Hydrogen Credit System
Write-Host "🚀 Starting AI-Powered Green Hydrogen Credit System..." -ForegroundColor Green

# Start Backend Server
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python test_simple.py"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm start"

# Wait a moment for frontend to start
Start-Sleep -Seconds 5

Write-Host "✅ System Starting..." -ForegroundColor Green
Write-Host "🌐 Frontend URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🧠 ML Verification: http://localhost:3000/ngo-dashboard" -ForegroundColor Cyan
Write-Host "👨‍💼 Auditor Dashboard: http://localhost:3000/auditor-dashboard" -ForegroundColor Cyan
Write-Host "🛒 Buyer Dashboard: http://localhost:3000/buyer-dashboard" -ForegroundColor Cyan

Write-Host "🎯 Your AI-Powered Green Hydrogen Credit System is ready!" -ForegroundColor Green


