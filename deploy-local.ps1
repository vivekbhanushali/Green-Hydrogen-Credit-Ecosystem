# Deploy the carbon credit contract to local hardhat network
# Usage: ./deploy-local.ps1

# Ensure we're in the right directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "Creating sample .env file..."
    @"
# Alchemy or Infura Sepolia testnet URL - Replace with your actual API key
TESTNET_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
# Development private key - DO NOT use for production or with real funds!
# This is a placeholder 32-byte private key (64 hex chars without 0x prefix)
PRIVATE_KEY=4c0883a69102937d6231471b5ecb8b8e4e5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "Created .env file. Please update with your actual keys."
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
    Write-Host "Compilation failed. Please check errors above."
    exit 1
}

# Start Hardhat node in a new window
Write-Host "Starting Hardhat node..."
Start-Process powershell -ArgumentList "-NoExit -Command `"cd $scriptDir\smartContracts; npx hardhat node`"" -WindowStyle Normal

# Give it a moment to start
Write-Host "Waiting for Hardhat node to start..."
Start-Sleep -Seconds 5

# Deploy the contract
Write-Host "Deploying contract..."
Push-Location smartContracts
node scripts/deploy-simple.js 2>&1 | Tee-Object -Variable deployOutput
Pop-Location

# Check if deployment was successful
if ($deployOutput -match "Failed" -or $deployOutput -match "Error") {
    Write-Host "Deployment failed. Please check errors above."
    exit 1
}

# Copy ABI to frontend
Write-Host "Copying ABI to frontend..."
Push-Location smartContracts
node scripts/copyAbi.js
Pop-Location

Write-Host "Blockchain setup complete!"
Write-Host "You can now start the frontend with 'cd client && npm start'"
Write-Host "And the backend with 'cd backend && python run.py'"
Write-Host ""
Write-Host "Remember to connect MetaMask to the local network (localhost:8545)."
