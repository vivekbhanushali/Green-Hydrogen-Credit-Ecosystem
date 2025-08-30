# Carbon Credit Blockchain Project Setup Guide

This guide will help you set up and run the Carbon Credit blockchain project properly. Follow these steps in order.

## Prerequisites

- Node.js (preferably v22.10.0 LTS or higher)
- MetaMask extension installed in your browser
- An account on [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/) to get a Sepolia testnet URL

## Step 1: Configure Environment Variables

1. Edit the `.env` file in the project root and add your testnet URL and private key:

```
# Alchemy or Infura Sepolia testnet URL
TESTNET_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key

# Development private key - DO NOT use for production or with real funds!
# Remove the 0x prefix if it exists
PRIVATE_KEY=your-private-key-without-0x-prefix
```

## Step 2: Install Dependencies and Compile Smart Contract

Run the following commands in PowerShell:

```powershell
# Navigate to the smart contracts directory
cd D:\Carbon-Credit-master\Carbon-Credit-master\smartContracts

# Install dependencies
npm install

# Compile the smart contract
npx hardhat compile
```

## Step 3: Deploy the Smart Contract

For local development:

```powershell
# Start a local hardhat node in one terminal
npx hardhat node

# In another terminal, deploy the contract to the local network
npx hardhat run .\scripts\deploy.js --network localhost
```

For Sepolia testnet deployment:

```powershell
# Deploy to Sepolia
npx hardhat run .\scripts\deploy.js --network sepolia
```

## Step 4: Copy ABI to Frontend

After successful deployment, copy the compiled ABI to the frontend:

```powershell
# Copy ABI to frontend
node .\scripts\copyAbi.js
```

## Step 5: Frontend Setup

```powershell
# Navigate to client directory
cd ..\client

# Install dependencies
npm install

# Start the development server
npm start
```

## Step 6: Backend Setup

```powershell
# Navigate to backend directory
cd ..\backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python run.py
```

## Using the Application

1. Connect your MetaMask to the deployed network (localhost or Sepolia)
2. Make sure your MetaMask account has some test ETH for transactions
3. Access the application through the frontend
4. Create, buy, sell, and manage carbon credits through the UI

## Troubleshooting

- If the contract compilation fails, check the solidity version compatibility
- If MetaMask transactions fail, make sure you have enough test ETH
- If the frontend can't connect to the contract, verify the contract address in `client/src/context/constants.js`

For any other issues, refer to the project documentation or contact support.
