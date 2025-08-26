const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  // Get network name
  const network = (await ethers.provider.getNetwork()).name;
  
  // Read deployment info
  const deploymentPath = `./deployments/${network}_deployment.json`;
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ Deployment file not found: ${deploymentPath}`);
    console.log("Available deployments:");
    const files = fs.readdirSync("./deployments/");
    files.forEach(file => console.log(`  - ${file}`));
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deploymentInfo.address;

  console.log(`🔍 Verifying contract at: ${contractAddress}`);
  console.log(`📡 Network: ${network}`);

  try {
    // Verify the contract
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // No constructor arguments for our contract
    });
    
    console.log("✅ Contract verified successfully!");
    
    // Update deployment info with verification status
    deploymentInfo.verified = true;
    deploymentInfo.verifiedAt = new Date().toISOString();
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract was already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });