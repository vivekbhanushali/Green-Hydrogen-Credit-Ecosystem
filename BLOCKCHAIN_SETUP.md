# Carbon Credit Project - Blockchain Setup Guide

This script will help you set up and manage the blockchain-related components of the Carbon Credit project.

## Prerequisites

1. Node.js and npm installed
2. MetaMask or another Ethereum wallet
3. Access to Ethereum testnet (Sepolia) through Alchemy or Infura

## Setup Steps

### 1. Environment Setup

Create a `.env` file in the project root with:

```
# Alchemy or Infura Sepolia testnet URL
TESTNET_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key

# Development private key - DO NOT use for production or with real funds!
PRIVATE_KEY=your-private-key-without-0x-prefix
```

### 2. Smart Contract Setup

```powershell
# Navigate to the smart contracts directory
cd smartContracts

# Install dependencies
npm install

# Compile the smart contract
npx hardhat compile

# Test the smart contract
npx hardhat test

# Deploy to local development network
npx hardhat node
# In a new terminal:
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Copy ABI to frontend
node scripts/copyAbi.js
```

### 3. Frontend Setup

```powershell
# Navigate to the client directory
cd ../client

# Install dependencies
npm install

# Start the development server
npm start
```

### 4. Backend Setup

```powershell
# Navigate to the backend directory
cd ../backend

# Setup Python virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python run.py
```

## Testing the Full Stack

1. Start the backend server
2. Start the frontend development server
3. Connect MetaMask to the appropriate network (localhost:8545 or Sepolia)
4. Interact with the application

## Common Issues and Solutions

- **Contract compilation errors**: Check the Solidity version compatibility
- **MetaMask connection issues**: Ensure you're connected to the correct network
- **Transaction failures**: Check for sufficient ETH in your test account
- **Frontend not connecting to contract**: Verify that the contract address in constants.js is correct
