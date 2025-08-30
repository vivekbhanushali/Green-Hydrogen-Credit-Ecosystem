require("dotenv").config({ path: '../.env' });

// Default to hardhat's built-in accounts for development if no private key is provided
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TESTNET_URL = process.env.TESTNET_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24", // Using a stable Solidity version
  paths: {
    artifacts: "./artifacts",
    cache: "./cache"
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    hardhat: {
      chainId: 31337
    },
    // Only include sepolia config if we have credentials
    ...(TESTNET_URL && PRIVATE_KEY ? {
      sepolia: {
        url: TESTNET_URL,
        accounts: [`0x${PRIVATE_KEY}`],
        chainId: 11155111
      }
    } : {})
  },
};
