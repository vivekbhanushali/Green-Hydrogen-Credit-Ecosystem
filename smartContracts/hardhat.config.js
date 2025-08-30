import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load .env from parent directory
dotenvConfig({ path: resolve(process.cwd(), '../.env') });

const { TESTNET_URL, PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
export default {
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
    sepolia: {
      url: TESTNET_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      chainId: 11155111
    }
  },
};
