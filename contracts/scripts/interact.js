const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const network = (await ethers.provider.getNetwork()).name;
  const deploymentPath = `./deployments/${network}_deployment.json`;

  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ Deployment file not found: ${deploymentPath}`);
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deploymentInfo.address;

  console.log(`🔗 Connecting to contract at: ${contractAddress}`);

  // Get contract instance
  const TestnetDonationSystem = await ethers.getContractFactory("TestnetDonationSystem");
  const contract = TestnetDonationSystem.attach(contractAddress);

  console.log("\n📊 Contract Information:");
  console.log(`Address: ${contractAddress}`);
  console.log(`Network: ${network}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);

  try {
    // Get contract details
    const owner = await contract.owner();
    const backendService = await contract.backendService();
    const name = await contract.name();
    const symbol = await contract.symbol();

    console.log(`\n🔧 Contract Details:`);
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Owner: ${owner}`);
    console.log(`Backend Service: ${backendService}`);

    // Get badge thresholds
    const bronzeThreshold = await contract.BRONZE_THRESHOLD();
    const silverThreshold = await contract.SILVER_THRESHOLD();
    const goldThreshold = await contract.GOLD_THRESHOLD();
    const diamondThreshold = await contract.DIAMOND_THRESHOLD();

    console.log(`\n🏆 Badge Thresholds:`);
    console.log(`🥉 Bronze: ${ethers.formatEther(bronzeThreshold)} ETH`);
    console.log(`🥈 Silver: ${ethers.formatEther(silverThreshold)} ETH`);
    console.log(`🥇 Gold: ${ethers.formatEther(goldThreshold)} ETH`);
    console.log(`💎 Diamond: ${ethers.formatEther(diamondThreshold)} ETH`);

    // Check donation pools
    console.log(`\n🏊‍♂️ Donation Pools:`);
    const chains = ["ethereum", "polygon", "bsc", "arbitrum"];
    
    for (const chain of chains) {
      try {
        const pool = await contract.getPoolInfo(chain);
        console.log(`${chain}: Total=${ethers.formatEther(pool.totalAmount)} ETH, Available=${ethers.formatEther(pool.available)} ETH, Active=${pool.isActive}`);
      } catch (error) {
        console.log(`${chain}: Not created yet`);
      }
    }

    console.log(`\n✅ Contract interaction completed successfully!`);

  } catch (error) {
    console.error("❌ Error interacting with contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });