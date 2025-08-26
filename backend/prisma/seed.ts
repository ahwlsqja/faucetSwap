import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed faucet configurations
  const faucetConfigs = [
    {
      chain: 'ethereum',
      name: 'Ethereum Sepolia',
      token: 'ETH',
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/your-api-key',
      faucetUrl: 'https://sepoliafaucet.com',
      cooldownHours: 24,
      maxAmount: '0.5',
      minBalance: '0.01',
    },
    {
      chain: 'polygon',
      name: 'Polygon Mumbai',
      token: 'MATIC',
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
      faucetUrl: 'https://faucet.polygon.technology',
      cooldownHours: 24,
      maxAmount: '1.0',
      minBalance: '0.1',
    },
    {
      chain: 'bsc',
      name: 'BSC Testnet',
      token: 'BNB',
      rpcUrl: process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
      faucetUrl: 'https://testnet.binance.org/faucet-smart',
      cooldownHours: 24,
      maxAmount: '0.1',
      minBalance: '0.01',
    },
    {
      chain: 'arbitrum',
      name: 'Arbitrum Sepolia',
      token: 'ETH',
      rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      faucetUrl: 'https://bridge.arbitrum.io',
      cooldownHours: 24,
      maxAmount: '0.1',
      minBalance: '0.01',
    },
  ];

  for (const config of faucetConfigs) {
    await prisma.faucetConfig.upsert({
      where: { chain: config.chain },
      update: config,
      create: config,
    });
  }

  // Initialize donation pools
  for (const config of faucetConfigs) {
    await prisma.donationPool.upsert({
      where: { chain: config.chain },
      update: {},
      create: {
        chain: config.chain,
        token: config.token,
        totalAmount: '0',
        available: '0',
        distributed: '0',
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });