// Simple deploy script that uses ethers directly
const { ethers } = require('ethers');
const fs = require('fs-extra');
const path = require('path');

// Load the contract artifact
const contractArtifact = require('../artifacts/contracts/CarbonCredit.sol/CarbonCredit.json');

async function main() {
  try {
    console.log('Deploying CarbonCredit smart contract...');
    
    // Connect to the local network
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    
    // Get the first account
    const accounts = await provider.listAccounts();
    const deployer = provider.getSigner(accounts[0]);
    const deployerAddress = accounts[0];
    
    console.log(`Deploying from account: ${deployerAddress}`);
    
    // Create a factory and deploy the contract
    const factory = new ethers.ContractFactory(
      contractArtifact.abi,
      contractArtifact.bytecode,
      deployer
    );
    
    const contract = await factory.deploy();
    await contract.deployTransaction.wait();
    
    console.log(`CarbonCredit deployed to: ${contract.address}`);
    
    // Update the constants.js file
    const constantsPath = path.join(__dirname, '../../client/src/context/constants.js');
    
    if (fs.existsSync(constantsPath)) {
      let constants = fs.readFileSync(constantsPath, 'utf8');
      
      // Replace the contract address
      constants = constants.replace(
        /export const CC_ADDRESS = '(0x[a-fA-F0-9]{40})'/,
        `export const CC_ADDRESS = '${contract.address}'`
      );
      
      fs.writeFileSync(constantsPath, constants);
      console.log(`Updated contract address in constants.js`);
    } else {
      console.warn(`Constants file not found at ${constantsPath}`);
    }
    
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
