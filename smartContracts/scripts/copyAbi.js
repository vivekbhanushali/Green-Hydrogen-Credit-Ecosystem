const fs = require('fs-extra');
const path = require('path');

// Path to the generated artifact
const artifactPath = path.join(__dirname, '../artifacts/contracts/CarbonCredit.sol/CarbonCredit.json');
// Path to copy the ABI to
const abiDestPath = path.join(__dirname, '../../client/src/context/CarbonCredit.json');

// Function to copy the ABI
async function copyAbi() {
  try {
    // Check if artifact exists
    if (!fs.existsSync(artifactPath)) {
      console.error('Artifact not found. Make sure you have compiled the contract.');
      process.exit(1);
    }

    // Read the artifact
    const artifact = JSON.parse(await fs.readFile(artifactPath, 'utf8'));

    // Create directories if they don't exist
    const destDir = path.dirname(abiDestPath);
    if (!fs.existsSync(destDir)) {
      await fs.mkdirs(destDir);
    }

    // Write the ABI to the destination
    await fs.writeFile(abiDestPath, JSON.stringify(artifact, null, 2));

    console.log(`ABI successfully copied to ${abiDestPath}`);
  } catch (error) {
    console.error('Error copying ABI:', error);
    process.exit(1);
  }
}

// Execute
copyAbi();
