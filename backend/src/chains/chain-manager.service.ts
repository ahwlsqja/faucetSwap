import { Injectable, Logger } from '@nestjs/common';
import { EVMChainService } from './services/evm-chain.service';
import { SuiChainService } from './services/sui-chain.service';

@Injectable()
export class ChainManager {
  private readonly logger = new Logger(ChainManager.name);

  constructor(
    private readonly evmChainService: EVMChainService,
    private readonly suiChainService: SuiChainService,
  ) {}

  // 지원하는 체인 설정 (BSC 제거)
  private readonly supportedChains = {
    ethereum: { 
      type: 'evm', 
      name: 'Ethereum Sepolia', 
      symbol: 'ETH', 
      explorer: 'https://sepolia.etherscan.io',
      faucetUrl: 'https://sepoliafaucet.com',
    },
    sui: { 
      type: 'sui', 
      name: 'Sui Testnet', 
      symbol: 'SUI',
      explorer: 'https://suiexplorer.com',
      faucetUrl: 'https://docs.sui.io/testnet',
    },
  };

  // 지원 체인 목록 (stateless)
  getSupportedChains(): string[] {
    return Object.keys(this.supportedChains);
  }

  // 체인별 설정 조회 (stateless)
  getChainConfig(chainId: string) {
    return this.supportedChains[chainId] || null;
  }

  // 모든 체인 설정 조회 (stateless)
  getAllChainConfigs() {
    return this.supportedChains;
  }

  // 🕒 파우셋 쿨다운 검사 (핵심 백엔드 기능)
  async checkFaucetCooldown(chainId: string, userAddress: string) {
    const chainConfig = this.getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    try {
      if (chainConfig.type === 'evm') {
        // EVM 체인 서비스 사용
        const result = await this.evmChainService.checkCooldown(chainId, userAddress);
        return {
          ...result,
          chainInfo: chainConfig,
        };
      } else if (chainConfig.type === 'sui') {
        // Sui 체인 서비스 사용
        const result = await this.suiChainService.checkCooldown(userAddress);
        return {
          ...result,
          chainInfo: chainConfig,
        };
      } else {
        throw new Error(`Chain type ${chainConfig.type} not implemented`);
      }
    } catch (error) {
      this.logger.error(`Failed to check cooldown for ${chainId}:`, error);
      return {
        canClaim: false,
        remainingTime: 86400000,
        chainInfo: chainConfig,
        error: error.message,
      };
    }
  }

  // 📊 체인별 통계 조회 (핵심 백엔드 기능)
  async getChainStatistics(chainId?: string) {
    const chains = chainId ? [chainId] : this.getSupportedChains();
    const stats: Record<string, any> = {};
    
    for (const chain of chains) {
      const config = this.getChainConfig(chain);
      if (!config) continue;

      try {
        let poolStats, recentActivity;
        
        if (config.type === 'evm') {
          poolStats = await this.evmChainService.getPoolStatistics(chain);
          recentActivity = await this.evmChainService.getRecentDonations(chain, 5);
        } else if (config.type === 'sui') {
          poolStats = await this.suiChainService.getPoolStatistics();
          recentActivity = await this.suiChainService.getRecentDonations(5);
        }
        
        stats[chain] = {
          ...config,
          statistics: poolStats,
          recentActivity,
          lastUpdated: new Date(),
        };
      } catch (error) {
        this.logger.error(`Failed to get stats for ${chain}:`, error);
        stats[chain] = {
          ...config,
          error: error.message,
          lastUpdated: new Date(),
        };
      }
    }

    return chainId ? stats[chainId] : stats;
  }

  // 🔍 사용자 기여도 조회 (NFT 배지용)
  async getUserContribution(chainId: string, userAddress: string) {
    const config = this.getChainConfig(chainId);
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    try {
      if (config.type === 'evm') {
        return await this.evmChainService.getContributionLevel(chainId, userAddress);
      } else if (config.type === 'sui') {
        return await this.suiChainService.getContributionLevel(userAddress);
      } else {
        throw new Error(`Chain type ${config.type} not implemented`);
      }
    } catch (error) {
      this.logger.error(`Failed to get contribution for ${userAddress} on ${chainId}:`, error);
      return {
        level: 0,
        levelName: 'None',
        totalDonated: '0',
        nextLevelRequirement: '0.1',
        error: error.message,
      };
    }
  }

  // 🏆 사용자 랭킹 조회 (추후 구현 - 복잡한 로직 필요)
  async getUserRanking(chainId: string, limit: number = 10) {
    const config = this.getChainConfig(chainId);
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    try {
      // TODO: 실제 구현시 모든 기부자 데이터를 조회해서 정렬해야 함
      // 현재는 최근 기부 내역으로 대체
      if (config.type === 'evm') {
        const recentDonations = await this.evmChainService.getRecentDonations(chainId, limit);
        return recentDonations.map((donation, index) => ({
          rank: index + 1,
          address: donation.donor,
          totalDonated: donation.amount,
          lastDonation: donation.timestamp,
        }));
      } else if (config.type === 'sui') {
        const recentDonations = await this.suiChainService.getRecentDonations(limit);
        return recentDonations.map((donation, index) => ({
          rank: index + 1,
          address: donation.donor,
          totalDonated: donation.amount,
          lastDonation: donation.timestamp,
        }));
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to get rankings for ${chainId}:`, error);
      return [];
    }
  }

  // ⚡ 헬스 체크 (모든 체인 상태 확인)
  async healthCheck() {
    const health: Record<string, any> = {};
    const chains = this.getSupportedChains();
    
    for (const chainId of chains) {
      try {
        const config = this.getChainConfig(chainId);
        
        if (config.type === 'evm') {
          const connectionInfo = await this.evmChainService.checkConnection(chainId);
          health[chainId] = {
            status: connectionInfo.connected ? 'healthy' : 'unhealthy',
            ...connectionInfo,
            config,
            lastChecked: new Date(),
          };
        } else if (config.type === 'sui') {
          const connectionInfo = await this.suiChainService.checkConnection();
          health[chainId] = {
            status: connectionInfo.connected ? 'healthy' : 'unhealthy',
            ...connectionInfo,
            config,
            lastChecked: new Date(),
          };
        } else {
          health[chainId] = {
            status: 'unknown',
            config,
            lastChecked: new Date(),
            note: 'Chain type not implemented',
          };
        }
      } catch (error) {
        health[chainId] = {
          status: 'unhealthy',
          error: error.message,
          lastChecked: new Date(),
        };
      }
    }

    return health;
  }

  // 📜 모든 체인에서 최근 활동 조회
  async getAllRecentActivity(limit: number = 20) {
    const allActivity = [];
    const chains = this.getSupportedChains();
    
    for (const chainId of chains) {
      try {
        const config = this.getChainConfig(chainId);
        let recentActivity = [];
        
        if (config.type === 'evm') {
          recentActivity = await this.evmChainService.getRecentDonations(chainId, limit);
        } else if (config.type === 'sui') {
          recentActivity = await this.suiChainService.getRecentDonations(limit);
        }
        
        // 체인 정보 추가
        const activityWithChain = recentActivity.map(activity => ({
          ...activity,
          chainId,
          chainName: config.name,
          chainSymbol: config.symbol,
        }));
        
        allActivity.push(...activityWithChain);
      } catch (error) {
        this.logger.error(`Failed to get activity for ${chainId}:`, error);
      }
    }
    
    // 시간순 정렬하고 제한
    return allActivity
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}