// Import required modules
const hre = require("hardhat");
const fs = require('fs-extra');
const path = require('path');

async function main() {
  try {
    console.log("Deploying CarbonCredit smart contract...");
    
    // Get the ethers object from hardhat
    const ethers = hre.ethers;
    
    // Get the signer (account to deploy from)
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    
    // Deploy the contract
    const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
    const carbonCredit = await CarbonCredit.deploy();
    await carbonCredit.deployTransaction.wait();
    
    const contractAddress = carbonCredit.address;
    console.log(`CarbonCredit deployed to: ${contractAddress}`);
    
    // Update the constants.js file with the new contract address
    const constantsPath = path.join(__dirname, '../../client/src/context/constants.js');
    
    if (fs.existsSync(constantsPath)) {
      let constants = fs.readFileSync(constantsPath, 'utf8');
      
      // Replace the contract address
      constants = constants.replace(
        /export const CC_ADDRESS = '(0x[a-fA-F0-9]{40})'/,
        `export const CC_ADDRESS = '${contractAddress}'`
      );
      
      fs.writeFileSync(constantsPath, constants);
      console.log(`Updated contract address in constants.js`);
    } else {
      console.warn(`Constants file not found at ${constantsPath}`);
    }
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Execute and handle the promise chain
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
