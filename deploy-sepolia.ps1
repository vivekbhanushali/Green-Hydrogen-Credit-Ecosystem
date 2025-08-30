# Deploy the carbon credit contract to Sepolia testnet
# Usage: ./deploy-sepolia.ps1

# Ensure we're in the right directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check if .env file exists with required values
if (-not (Test-Path .env)) {
    Write-Host "Error: .env file not found. Create it with TESTNET_URL and PRIVATE_KEY" -ForegroundColor Red
    exit 1
}

# Check if .env contains required keys
$envContent = Get-Content .env
if (-not ($envContent -match "TESTNET_URL") -or -not ($envContent -match "PRIVATE_KEY")) {
    Write-Host "Error: .env file must contain TESTNET_URL and PRIVATE_KEY values" -ForegroundColor Red
    exit 1
}

# First check if we need to install dependencies
if (-not (Test-Path smartContracts\node_modules)) {
    Write-Host "Installing smart contract dependencies..."
    Push-Location smartContracts
    npm install
    Pop-Location
}

# Compile the contract
Write-Host "Compiling smart contract..."
Push-Location smartContracts
npm run compile 2>&1 | Tee-Object -Variable compileOutput
Pop-Location

# Check if compilation was successful
if ($compileOutput -match "Failed" -or $compileOutput -match "Error") {
    Write-Host "Compilation failed. Please check errors above." -ForegroundColor Red
    exit 1
}

# Deploy the contract to Sepolia
Write-Host "Deploying contract to Sepolia testnet..."
Push-Location smartContracts
npx hardhat run scripts/deploy-simple.js --network sepolia 2>&1 | Tee-Object -Variable deployOutput
Pop-Location

# Check if deployment was successful
if ($deployOutput -match "Failed" -or $deployOutput -match "Error") {
    Write-Host "Deployment failed. Please check errors above." -ForegroundColor Red
    exit 1
}

# Copy ABI to frontend
Write-Host "Copying ABI to frontend..."
Push-Location smartContracts
node scripts/copyAbi.js
Pop-Location

Write-Host "Blockchain setup complete!" -ForegroundColor Green
Write-Host "Contract is deployed to Sepolia testnet" -ForegroundColor Green
Write-Host "You can now start the frontend with 'cd client && npm start'"
Write-Host "And the backend with 'cd backend && python run.py'"
Write-Host ""
Write-Host "Remember to connect MetaMask to the Sepolia network."
