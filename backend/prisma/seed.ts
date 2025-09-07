import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed faucet configurations with realistic cooldown times
  const faucetConfigs = [
    {
      chain: 'ethereum',
      name: 'Ethereum Sepolia',
      token: 'ETH',
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/your-api-key',
      faucetUrl: 'https://sepoliafaucet.com',
      cooldownHours: 12, // 실제 QuickNode 등 주요 파우셋 기준
      maxAmount: '0.1',  // 실제 평균 지급량
      minBalance: '0.001',
    },
    {
      chain: 'polygon',
      name: 'Polygon Mumbai',
      token: 'MATIC',
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
      faucetUrl: 'https://faucet.polygon.technology',
      cooldownHours: 24, // 폴리곤 공식 파우셋
      maxAmount: '0.5',  // MATIC 파우셋은 더 많이 줌
      minBalance: '0.01',
    },
    {
      chain: 'sui',
      name: 'Sui Testnet',
      token: 'SUI',
      rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io',
      faucetUrl: 'https://docs.sui.io/testnet',
      cooldownHours: 24, // Sui 공식 Discord 파우셋
      maxAmount: '0.01', // 0.01 SUI per request
      minBalance: '0.001',
    },
    {
      chain: 'bsc',
      name: 'BSC Testnet',
      token: 'BNB',
      rpcUrl: process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
      faucetUrl: 'https://testnet.binance.org/faucet-smart',
      cooldownHours: 24, // 바이낸스 공식
      maxAmount: '0.1',
      minBalance: '0.01',
    },
    {
      chain: 'arbitrum',
      name: 'Arbitrum Sepolia',
      token: 'ETH',
      rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      faucetUrl: 'https://bridge.arbitrum.io',
      cooldownHours: 24, // 아비트럼 브릿지 파우셋
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