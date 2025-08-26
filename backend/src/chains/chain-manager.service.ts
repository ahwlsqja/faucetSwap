import { Injectable, Logger } from '@nestjs/common';
import { BaseChainAdapter } from './interfaces/base-chain.interface';

// 새로운 체인 타입 정의
export interface ChainModule {
  chainId: string;
  chainType: 'evm' | 'sui' | 'solana' | 'near' | 'cosmos' | 'cardano';
  name: string;
  symbol: string;
  
  // 풀 관리
  deployDonationPool(): Promise<string>;
  getDonationPoolAddress(): string;
  
  // 기부 관리
  processDonation(donor: string, amount: string, txHash: string): Promise<boolean>;
  getDonationHistory(limit?: number): Promise<DonationRecord[]>;
  
  // 분배 관리
  distributeTokens(recipient: string, amount: string, reason: string): Promise<string>;
  getAvailableBalance(): Promise<string>;
}

export interface DonationRecord {
  donor: string;
  amount: string;
  timestamp: Date;
  txHash: string;
  chain: string;
}

@Injectable()
export class ChainManager {
  private readonly logger = new Logger(ChainManager.name);
  private modules: Map<string, ChainModule> = new Map();

  // 체인 모듈 등록 (플러그인 방식)
  registerChain(chainId: string, module: ChainModule) {
    this.modules.set(chainId, module);
    this.logger.log(`✅ Chain module registered: ${chainId} (${module.chainType})`);
  }

  // 체인 모듈 제거
  unregisterChain(chainId: string) {
    if (this.modules.has(chainId)) {
      this.modules.delete(chainId);
      this.logger.log(`❌ Chain module unregistered: ${chainId}`);
    }
  }

  // 지원 체인 목록
  getSupportedChains(): string[] {
    return Array.from(this.modules.keys());
  }

  // 체인별 타입 조회
  getChainTypes(): Record<string, string> {
    const types: Record<string, string> = {};
    for (const [chainId, module] of this.modules) {
      types[chainId] = module.chainType;
    }
    return types;
  }

  // 특정 체인 모듈 조회
  getChainModule(chainId: string): ChainModule | undefined {
    return this.modules.get(chainId);
  }

  // 모든 체인에서 기부 내역 수집
  async getAllDonations(): Promise<DonationRecord[]> {
    const allDonations: DonationRecord[] = [];
    
    for (const [chainId, module] of this.modules) {
      try {
        const donations = await module.getDonationHistory(50);
        allDonations.push(...donations);
      } catch (error) {
        this.logger.error(`Failed to get donations from ${chainId}:`, error);
      }
    }

    // 시간순 정렬
    return allDonations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // 체인별 풀 상태 조회
  async getPoolStatuses() {
    const statuses: Record<string, any> = {};
    
    for (const [chainId, module] of this.modules) {
      try {
        const balance = await module.getAvailableBalance();
        const poolAddress = module.getDonationPoolAddress();
        
        statuses[chainId] = {
          chainType: module.chainType,
          name: module.name,
          symbol: module.symbol,
          availableBalance: balance,
          poolAddress: poolAddress,
          isActive: true,
        };
      } catch (error) {
        this.logger.error(`Failed to get status for ${chainId}:`, error);
        statuses[chainId] = {
          chainType: module.chainType,
          name: module.name,
          symbol: module.symbol,
          isActive: false,
          error: error.message,
        };
      }
    }

    return statuses;
  }

  // 📊 통계용 - 백엔드는 이제 읽기 전용
  async getChainStatistics() {
    const stats: Record<string, any> = {};
    
    for (const [chainId, module] of this.modules) {
      try {
        const balance = await module.getAvailableBalance();
        const donations = await module.getDonationHistory(100);
        
        stats[chainId] = {
          chainType: module.chainType,
          name: module.name,
          symbol: module.symbol,
          poolBalance: balance,
          totalDonations: donations.length,
          recentActivity: donations.slice(0, 5),
          lastUpdated: new Date(),
        };
      } catch (error) {
        this.logger.error(`Failed to get stats for ${chainId}:`, error);
        stats[chainId] = { error: error.message };
      }
    }

    return stats;
  }

  // 새로운 체인 추가시 초기화
  async initializeNewChain(chainId: string, config: any) {
    const module = this.modules.get(chainId);
    if (!module) {
      throw new Error(`Chain ${chainId} not registered`);
    }

    try {
      // 풀 컨트랙트 배포
      const poolAddress = await module.deployDonationPool();
      
      this.logger.log(`🚀 Initialized ${chainId} with pool at ${poolAddress}`);
      
      return {
        chainId,
        poolAddress,
        status: 'initialized',
      };
    } catch (error) {
      this.logger.error(`Failed to initialize ${chainId}:`, error);
      throw error;
    }
  }

  // 헬스 체크 (모든 체인 상태 확인)
  async healthCheck() {
    const health: Record<string, any> = {};
    
    for (const [chainId, module] of this.modules) {
      try {
        // 간단한 상태 확인 (잔액 조회)
        const balance = await module.getAvailableBalance();
        health[chainId] = {
          status: 'healthy',
          balance,
          lastChecked: new Date(),
        };
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
}