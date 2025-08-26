const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TestnetDonationSystem...");

  // Get the contract factory
  const TestnetDonationSystem = await ethers.getContractFactory("TestnetDonationSystem");

  // Deploy the contract
  const donationSystem = await TestnetDonationSystem.deploy();
  await donationSystem.waitForDeployment();

  const contractAddress = await donationSystem.getAddress();
  console.log("TestnetDonationSystem deployed to:", contractAddress);

  // Create initial pools for supported chains
  const supportedChains = ["ethereum", "polygon", "bsc", "arbitrum"];
  
  console.log("Creating donation pools...");
  for (const chain of supportedChains) {
    try {
      const tx = await donationSystem.createPool(chain);
      await tx.wait();
      console.log(`✅ Created pool for ${chain}`);
    } catch (error) {
      console.log(`❌ Failed to create pool for ${chain}:`, error.message);
    }
  }

  console.log("\n🎉 Deployment completed!");
  console.log("Contract address:", contractAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  
  // Save deployment info
  const fs = require('fs');
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  const deploymentInfo = {
    address: contractAddress,
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    transactionHash: donationSystem.deploymentTransaction()?.hash,
    verified: false,
    verifiedAt: null,
  };
  
  const fileName = `./deployments/${deploymentInfo.network}_deployment.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`✅ Deployment info saved to ${fileName}`);
  console.log(`\n📋 Quick Setup for Backend:`);
  console.log(`DONATION_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`\n🔍 Next Steps:`);
  console.log(`1. Verify contract: npx hardhat run scripts/verify.js --network ${network.name}`);
  console.log(`2. Interact with contract: npx hardhat run scripts/interact.js --network ${network.name}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });