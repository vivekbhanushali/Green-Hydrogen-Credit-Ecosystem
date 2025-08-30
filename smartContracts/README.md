# Carbon Credit Smart Contract

This directory contains the smart contract code for the Carbon Credit tracking system.

## Setup

1. Install dependencies:
```shell
npm install
```

2. Configure environment variables:
   - Make sure the `.env` file exists in the project root with your Ethereum network details:
   ```
   TESTNET_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
   PRIVATE_KEY=your-private-key-without-0x-prefix
   ```

## Compilation

To compile the smart contract:

```shell
npx hardhat compile
```

## Testing

To run tests:

```shell
npx hardhat test
```

## Deployment

### Local Development Network

To deploy to a local hardhat network:

1. Start a local node:
```shell
npx hardhat node
```

2. In a separate terminal, deploy the contract:
```shell
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet Deployment

To deploy to Sepolia testnet:

```shell
npx hardhat run scripts/deploy.js --network sepolia
```

### Using Hardhat Ignition (Alternative)

```shell
npx hardhat ignition deploy ./ignition/modules/cc.js
```

## After Deployment

After deployment, the contract address will be updated automatically in the frontend's constants file.

To manually copy the ABI to the frontend:

```shell
node scripts/copyAbi.js
```
