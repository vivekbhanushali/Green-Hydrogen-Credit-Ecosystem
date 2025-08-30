# Carbon Credit Blockchain Setup Guide

This project uses a smart contract to track carbon credits on the blockchain. Follow these steps to set up and deploy the contract.

## Prerequisites

1. Node.js (LTS version recommended)
2. MetaMask browser extension
3. Access to Ethereum testnet (Sepolia)

## Setup Instructions

### 1. Configure Environment

1. Create or update the `.env` file in the project root:

```
# Alchemy or Infura Sepolia testnet URL
TESTNET_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key

# Development private key (without 0x prefix)
# CAUTION: Never use this key with real funds
PRIVATE_KEY=your-private-key-without-0x-prefix
```

### 2. Install Dependencies

```powershell
cd smartContracts
npm install
```

### 3. Compile Smart Contract

```powershell
cd smartContracts
npx hardhat compile
```

### 4. Deploy Smart Contract

#### For Local Development

Start a local Hardhat node:

```powershell
cd smartContracts
npx hardhat node
```

In a new terminal window, deploy the contract:

```powershell
cd smartContracts
npx hardhat run scripts/deploy-simple.js
```

#### For Testnet Deployment

```powershell
cd smartContracts
npx hardhat run scripts/deploy-simple.js --network sepolia
```

### 5. Copy ABI to Frontend

```powershell
cd smartContracts
node scripts/copyAbi.js
```

### 6. Update Frontend Constants

The deployment script should automatically update the contract address in `client/src/context/constants.js`. If not, manually update the `CC_ADDRESS` value.

### 7. Run Frontend

```powershell
cd client
npm install
npm start
```

## Troubleshooting

- **Compilation Issues**: Make sure Solidity version is supported (0.8.24 is used)
- **Deployment Errors**: Ensure Hardhat node is running for local deployment
- **MetaMask Connection**: Connect MetaMask to the correct network (localhost:8545 or Sepolia)
- **Transaction Failures**: Check for sufficient ETH in the account

## Smart Contract Overview

The `CarbonCredit` contract allows:
- Creating carbon credits with a specified amount
- Buying and selling carbon credits
- Requesting and performing audits
- Tracking ownership and transaction history
