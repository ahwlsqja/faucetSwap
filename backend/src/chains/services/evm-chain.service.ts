import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class EVMChainService {
  private readonly logger = new Logger(EVMChainService.name);
  private readonly providers: Map<string, ethers.JsonRpcProvider> = new Map();
  
  // 체인별 설정
  private readonly chainConfigs = {
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
      contractAddress: process.env.ETHEREUM_CONTRACT || '',
      chainId: 11155111, // Sepolia
    },
    bsc: {
      rpcUrl: process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
      contractAddress: process.env.BSC_CONTRACT || '',
      chainId: 97, // BSC Testnet
    },
  };

  // AutoFaucetPool 컨트랙트 ABI (실제 함수들)
  private readonly faucetABI = [
    // 읽기 함수들
    'function canClaim(address user) external view returns (bool)',
    'function getCooldownRemaining(address user) external view returns (uint256)',
    'function getContributionLevel(address user) external view returns (uint8)',
    'function totalDonated(address user) external view returns (uint256)',
    'function getPoolStats() external view returns (uint256, uint256, uint256, uint256, uint256)',
    'function faucetAmount() external view returns (uint256)',
    'function lastClaim(address user) external view returns (uint256)',
    
    // 이벤트들
    'event DonationReceived(address indexed donor, uint256 amount, string message)',
    'event FaucetClaimed(address indexed user, uint256 amount)',
  ];

  constructor() {
    this.initializeProviders();
  }

  // 프로바이더 초기화
  private initializeProviders() {
    for (const [chainId, config] of Object.entries(this.chainConfigs)) {
      try {
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.providers.set(chainId, provider);
        this.logger.log(`✅ EVM Provider initialized for ${chainId}`);
      } catch (error) {
        this.logger.error(`❌ Failed to initialize ${chainId} provider:`, error);
      }
    }
  }

  // 🕒 쿨다운 조회 (핵심 기능)
  async checkCooldown(chainId: string, userAddress: string): Promise<{
    canClaim: boolean;
    remainingTime: number; // milliseconds
    nextClaimTime?: Date;
    lastClaimTime?: Date;
  }> {
    const config = this.chainConfigs[chainId];
    const provider = this.providers.get(chainId);
    
    if (!config || !provider || !config.contractAddress) {
      throw new Error(`Chain ${chainId} not configured properly`);
    }

    try {
      const contract = new ethers.Contract(config.contractAddress, this.faucetABI, provider);
      
      // 컨트랙트에서 직접 조회
      const [canClaim, cooldownRemaining, lastClaim] = await Promise.all([
        contract.canClaim(userAddress),
        contract.getCooldownRemaining(userAddress),
        contract.lastClaim(userAddress).catch(() => BigInt(0)),
      ]);

      const remainingMs = Number(cooldownRemaining) * 1000;
      const lastClaimTimestamp = Number(lastClaim) * 1000;

      this.logger.log(`🔍 ${chainId} cooldown for ${userAddress}: ${remainingMs}ms remaining`);

      return {
        canClaim,
        remainingTime: remainingMs,
        nextClaimTime: canClaim ? undefined : new Date(Date.now() + remainingMs),
        lastClaimTime: lastClaimTimestamp > 0 ? new Date(lastClaimTimestamp) : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to check cooldown for ${chainId}:`, error);
      // 에러시 기본값 (24시간 쿨다운)
      return {
        canClaim: false,
        remainingTime: 24 * 60 * 60 * 1000,
      };
    }
  }

  // 🏆 기여도 레벨 조회
  async getContributionLevel(chainId: string, userAddress: string): Promise<{
    level: number;
    levelName: string;
    totalDonated: string; // ETH/MATIC 단위
    totalDonatedWei: string; // wei 단위
    nextLevelRequirement?: string;
  }> {
    const config = this.chainConfigs[chainId];
    const provider = this.providers.get(chainId);
    
    if (!config || !provider || !config.contractAddress) {
      throw new Error(`Chain ${chainId} not configured`);
    }

    try {
      const contract = new ethers.Contract(config.contractAddress, this.faucetABI, provider);
      
      const [level, totalDonatedWei] = await Promise.all([
        contract.getContributionLevel(userAddress),
        contract.totalDonated(userAddress),
      ]);

      const levelNum = Number(level);
      const totalDonated = ethers.formatEther(totalDonatedWei);
      
      const levelThresholds = [
        { level: 0, name: 'None', min: 0, next: 0.1 },
        { level: 1, name: 'Bronze', min: 0.1, next: 1.0 },
        { level: 2, name: 'Silver', min: 1.0, next: 5.0 },
        { level: 3, name: 'Gold', min: 5.0, next: 10.0 },
        { level: 4, name: 'Diamond', min: 10.0, next: null },
      ];

      const currentLevel = levelThresholds[levelNum] || levelThresholds[0];
      const nextLevelReq = currentLevel.next ? 
        (currentLevel.next - parseFloat(totalDonated)).toString() : 
        undefined;

      this.logger.log(`🏆 ${chainId} contribution for ${userAddress}: Level ${levelNum} (${currentLevel.name})`);

      return {
        level: levelNum,
        levelName: currentLevel.name,
        totalDonated,
        totalDonatedWei: totalDonatedWei.toString(),
        nextLevelRequirement: nextLevelReq,
      };
    } catch (error) {
      this.logger.error(`Failed to get contribution level for ${chainId}:`, error);
      return {
        level: 0,
        levelName: 'None',
        totalDonated: '0',
        totalDonatedWei: '0',
        nextLevelRequirement: '0.1',
      };
    }
  }

  // 📊 풀 통계 조회
  async getPoolStatistics(chainId: string): Promise<{
    currentBalance: string;
    totalDonations: string;
    totalClaimed: string;
    faucetAmount: string;
    availableClaims: number;
    contractAddress: string;
  }> {
    const config = this.chainConfigs[chainId];
    const provider = this.providers.get(chainId);
    
    if (!config || !provider || !config.contractAddress) {
      throw new Error(`Chain ${chainId} not configured`);
    }

    try {
      const contract = new ethers.Contract(config.contractAddress, this.faucetABI, provider);
      
      // getPoolStats() returns: currentBalance, totalDonations, totalClaimed, totalUsers, availableClaims
      const [poolStats, faucetAmount] = await Promise.all([
        contract.getPoolStats(),
        contract.faucetAmount(),
      ]);

      const currentBalance = ethers.formatEther(poolStats[0]);
      const totalDonations = ethers.formatEther(poolStats[1]); 
      const totalClaimed = ethers.formatEther(poolStats[2]);
      const faucetAmountFormatted = ethers.formatEther(faucetAmount);
      const availableClaims = Number(poolStats[4]);

      this.logger.log(`📊 ${chainId} pool stats: ${currentBalance} balance, ${availableClaims} claims available`);

      return {
        currentBalance,
        totalDonations,
        totalClaimed,
        faucetAmount: faucetAmountFormatted,
        availableClaims,
        contractAddress: config.contractAddress,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${chainId}:`, error);
      return {
        currentBalance: '0',
        totalDonations: '0',
        totalClaimed: '0',
        faucetAmount: '0.1',
        availableClaims: 0,
        contractAddress: config.contractAddress,
      };
    }
  }

  // 📜 최근 기부 내역 조회 (이벤트 로그)
  async getRecentDonations(chainId: string, limit: number = 10): Promise<Array<{
    donor: string;
    amount: string;
    message: string;
    timestamp: Date;
    txHash: string;
    blockNumber: number;
  }>> {
    const config = this.chainConfigs[chainId];
    const provider = this.providers.get(chainId);
    
    if (!config || !provider || !config.contractAddress) {
      return [];
    }

    try {
      const contract = new ethers.Contract(config.contractAddress, this.faucetABI, provider);
      
      // 최근 블록에서 DonationReceived 이벤트 조회
      const filter = contract.filters.DonationReceived();
      const events = await contract.queryFilter(filter, -5000); // 최근 5000블록
      
      const donations = await Promise.all(
        events.slice(-limit).map(async (event) => {
          const block = await event.getBlock();
          const eventLog = event as any;
          return {
            donor: eventLog.args[0],
            amount: ethers.formatEther(eventLog.args[1]),
            message: eventLog.args[2],
            timestamp: new Date(block.timestamp * 1000),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
          };
        })
      );

      this.logger.log(`📜 Retrieved ${donations.length} recent donations for ${chainId}`);
      return donations.reverse(); // 최신순 정렬
    } catch (error) {
      this.logger.error(`Failed to get recent donations for ${chainId}:`, error);
      return [];
    }
  }

  // 🔗 RPC 연결 상태 확인
  async checkConnection(chainId: string): Promise<{
    connected: boolean;
    blockNumber?: number;
    networkName?: string;
    error?: string;
  }> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      return { connected: false, error: 'Provider not found' };
    }

    try {
      const [blockNumber, network] = await Promise.all([
        provider.getBlockNumber(),
        provider.getNetwork(),
      ]);

      return {
        connected: true,
        blockNumber,
        networkName: network.name,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  // 📋 지원하는 체인 목록
  getSupportedChains(): string[] {
    return Object.keys(this.chainConfigs);
  }

  // ⚙️ 체인 설정 조회
  getChainConfig(chainId: string) {
    return this.chainConfigs[chainId] || null;
  }
}