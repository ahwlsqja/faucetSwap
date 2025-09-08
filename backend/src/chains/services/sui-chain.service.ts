import { Injectable, Logger } from '@nestjs/common';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';
import { fromB64 } from '@mysten/sui/utils';

@Injectable()
export class SuiChainService {
  private readonly logger = new Logger(SuiChainService.name);
  private readonly client: SuiClient;

  // Sui 설정
  private readonly suiConfig = {
    network: 'testnet' as const,
    rpcUrl: process.env.SUI_RPC_URL || getFullnodeUrl('testnet'),
    packageId: process.env.SUI_PACKAGE_ID || '',
    poolObjectId: process.env.SUI_POOL_OBJECT_ID || '',
    faucetHost: getFaucetHost('testnet'),
  };

  // 기여도 레벨 임계값 (SUI 단위)
  private readonly LEVEL_THRESHOLDS = {
    BRONZE: 0.1,    // 0.1 SUI
    SILVER: 1.0,    // 1 SUI  
    GOLD: 5.0,      // 5 SUI
    DIAMOND: 10.0,  // 10 SUI
  };

  constructor() {
    this.client = new SuiClient({ 
      url: this.suiConfig.rpcUrl 
    });
    this.logger.log(`✅ Sui client initialized for ${this.suiConfig.network}`);
    this.logger.log(`🔗 RPC: ${this.suiConfig.rpcUrl}`);
    this.logger.log(`📦 Package ID: ${this.suiConfig.packageId || 'Not configured'}`);
  }

  // 🕒 쿨다운 확인
  async checkCooldown(userAddress: string): Promise<{
    canClaim: boolean;
    remainingTime: number; // milliseconds
    nextClaimTime?: Date;
    lastClaimTime?: Date;
  }> {
    if (!this.suiConfig.packageId || !this.suiConfig.poolObjectId) {
      this.logger.warn('Sui package or pool object ID not configured, using default values');
      return {
        canClaim: true,
        remainingTime: 0,
      };
    }

    try {
      // 풀 객체에서 사용자의 마지막 클레임 시간 확인
      const poolObject = await this.client.getObject({
        id: this.suiConfig.poolObjectId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!poolObject.data?.content || poolObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid pool object data');
      }

      const poolData = poolObject.data.content.fields as any;
      
      // 사용자별 마지막 클레임 시간 확인 (24시간 쿨다운)
      const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24시간
      const lastClaimMap = poolData.last_claims || {};
      const lastClaimTime = lastClaimMap[userAddress];
      
      if (!lastClaimTime) {
        // 처음 요청하는 경우
        return {
          canClaim: true,
          remainingTime: 0,
        };
      }

      const lastClaimTimestamp = parseInt(lastClaimTime) * 1000; // ms로 변환
      const now = Date.now();
      const remainingTime = Math.max(0, (lastClaimTimestamp + COOLDOWN_MS) - now);
      const canClaim = remainingTime === 0;

      this.logger.log(`🔍 Sui cooldown for ${userAddress}: ${remainingTime}ms remaining`);

      return {
        canClaim,
        remainingTime,
        nextClaimTime: canClaim ? undefined : new Date(now + remainingTime),
        lastClaimTime: new Date(lastClaimTimestamp),
      };

    } catch (error) {
      this.logger.error('Failed to check Sui cooldown:', error);
      // 에러 시 기본값 (요청 허용, 24시간 후 다시 확인)
      return {
        canClaim: true,
        remainingTime: 0,
      };
    }
  }

  // 🏆 기여도 레벨 조회
  async getContributionLevel(userAddress: string): Promise<{
    level: number;
    levelName: string;
    totalDonated: string; // SUI 단위
    nextLevelRequirement?: string;
  }> {
    if (!this.suiConfig.packageId || !this.suiConfig.poolObjectId) {
      return {
        level: 0,
        levelName: 'None',
        totalDonated: '0',
        nextLevelRequirement: '0.1',
      };
    }

    try {
      // 풀 객체에서 사용자 기부 총액 확인
      const poolObject = await this.client.getObject({
        id: this.suiConfig.poolObjectId,
        options: {
          showContent: true,
        },
      });

      if (!poolObject.data?.content || poolObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid pool object');
      }

      const poolData = poolObject.data.content.fields as any;
      const donationsMap = poolData.total_donated || {};
      const totalDonatedMist = donationsMap[userAddress] || '0';
      const totalDonated = parseFloat(totalDonatedMist) / 1_000_000_000; // MIST to SUI

      // 레벨 계산
      let level = 0;
      let levelName = 'None';
      
      if (totalDonated >= this.LEVEL_THRESHOLDS.DIAMOND) {
        level = 4;
        levelName = 'Diamond';
      } else if (totalDonated >= this.LEVEL_THRESHOLDS.GOLD) {
        level = 3;
        levelName = 'Gold';
      } else if (totalDonated >= this.LEVEL_THRESHOLDS.SILVER) {
        level = 2;
        levelName = 'Silver';
      } else if (totalDonated >= this.LEVEL_THRESHOLDS.BRONZE) {
        level = 1;
        levelName = 'Bronze';
      }

      // 다음 레벨 요구량 계산
      let nextLevelRequirement: string | undefined;
      const thresholds = [
        this.LEVEL_THRESHOLDS.BRONZE,
        this.LEVEL_THRESHOLDS.SILVER,
        this.LEVEL_THRESHOLDS.GOLD,
        this.LEVEL_THRESHOLDS.DIAMOND,
      ];
      
      if (level < 4) {
        nextLevelRequirement = (thresholds[level] - totalDonated).toString();
      }

      this.logger.log(`🏆 Sui contribution for ${userAddress}: Level ${level} (${levelName})`);

      return {
        level,
        levelName,
        totalDonated: totalDonated.toString(),
        nextLevelRequirement,
      };

    } catch (error) {
      this.logger.error('Failed to get Sui contribution level:', error);
      return {
        level: 0,
        levelName: 'None',
        totalDonated: '0',
        nextLevelRequirement: '0.1',
      };
    }
  }

  // 📊 풀 통계 조회
  async getPoolStatistics(): Promise<{
    currentBalance: string;
    totalDonations: string;
    totalClaimed: string;
    faucetAmount: string;
    availableClaims: number;
    contractAddress: string;
  }> {
    if (!this.suiConfig.poolObjectId) {
      return {
        currentBalance: '0',
        totalDonations: '0',
        totalClaimed: '0',
        faucetAmount: '0.01', // 기본값
        availableClaims: 0,
        contractAddress: this.suiConfig.poolObjectId || '',
      };
    }

    try {
      // 풀 객체 상태 조회
      const poolObject = await this.client.getObject({
        id: this.suiConfig.poolObjectId,
        options: {
          showContent: true,
        },
      });

      if (!poolObject.data?.content || poolObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid pool object');
      }

      const poolData = poolObject.data.content.fields as any;
      
      // 풀 잔액 확인
      const balance = await this.client.getBalance({
        owner: this.suiConfig.poolObjectId,
      });

      const currentBalance = (parseInt(balance.totalBalance) / 1_000_000_000).toString(); // MIST to SUI
      const totalDonations = (parseInt(poolData.total_donations || '0') / 1_000_000_000).toString();
      const totalClaimed = (parseInt(poolData.total_claimed || '0') / 1_000_000_000).toString();
      const faucetAmount = (parseInt(poolData.faucet_amount || '10000000') / 1_000_000_000).toString(); // 기본 0.01 SUI
      const availableClaims = Math.floor(parseInt(balance.totalBalance) / parseInt(poolData.faucet_amount || '10000000'));

      this.logger.log(`📊 Sui pool stats: ${currentBalance} SUI balance, ${availableClaims} claims available`);

      return {
        currentBalance,
        totalDonations,
        totalClaimed,
        faucetAmount,
        availableClaims,
        contractAddress: this.suiConfig.poolObjectId,
      };

    } catch (error) {
      this.logger.error('Failed to get Sui pool stats:', error);
      return {
        currentBalance: '0',
        totalDonations: '0', 
        totalClaimed: '0',
        faucetAmount: '0.01',
        availableClaims: 0,
        contractAddress: this.suiConfig.poolObjectId || '',
      };
    }
  }

  // 📜 최근 기부 내역 조회 (이벤트 로그)
  async getRecentDonations(limit: number = 10): Promise<Array<{
    donor: string;
    amount: string;
    timestamp: Date;
    message: string;
  }>> {
    if (!this.suiConfig.packageId) {
      this.logger.warn('Sui package ID not configured, returning empty donations');
      return [];
    }

    try {
      // Sui 이벤트 조회
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${this.suiConfig.packageId}::faucet_pool::DonationReceived`
        },
        limit,
        order: 'descending',
      });

      const donations = events.data.map(event => {
        const eventData = event.parsedJson as any;
        const fields = eventData || {};
        
        return {
          donor: fields.donor || 'unknown',
          amount: fields.amount ? (parseInt(fields.amount) / 1_000_000_000).toString() : '0', // MIST to SUI
          timestamp: new Date(parseInt(event.timestampMs || '0')),
          message: fields.message || 'Sui donation',
        };
      });

      this.logger.log(`📜 Retrieved ${donations.length} recent donations for Sui`);
      return donations;

    } catch (error) {
      this.logger.error('Failed to get recent Sui donations:', error);
      return [];
    }
  }

  // 🔗 연결 상태 확인
  async checkConnection(): Promise<{
    connected: boolean;
    epoch?: string;
    chainIdentifier?: string;
    error?: string;
  }> {
    try {
      const [latestSuiSystemState, chainId] = await Promise.all([
        this.client.getLatestSuiSystemState(),
        this.client.getChainIdentifier(),
      ]);

      return {
        connected: true,
        epoch: latestSuiSystemState.epoch,
        chainIdentifier: chainId,
      };

    } catch (error) {
      this.logger.error('Sui connection check failed:', error);
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  // 🎯 Sui Testnet Faucet 요청 (공식 파우셋)
  async requestFromOfficialFaucet(userAddress: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await requestSuiFromFaucetV2({
        host: this.suiConfig.faucetHost,
        recipient: userAddress,
      });

      this.logger.log(`💧 Sui official faucet request sent for ${userAddress}`);
      return { success: true };

    } catch (error) {
      this.logger.error(`Failed to request from Sui official faucet:`, error);
      return { 
        success: false, 
        error: error.message || 'Faucet request failed' 
      };
    }
  }

  // 🔍 사용자 SUI 잔액 조회
  async getUserBalance(userAddress: string): Promise<{
    totalBalance: string; // SUI 단위
    coinCount: number;
  }> {
    try {
      const balance = await this.client.getBalance({
        owner: userAddress,
        coinType: '0x2::sui::SUI',
      });

      const coins = await this.client.getCoins({
        owner: userAddress,
        coinType: '0x2::sui::SUI',
      });

      return {
        totalBalance: (parseInt(balance.totalBalance) / 1_000_000_000).toString(), // MIST to SUI
        coinCount: coins.data.length,
      };

    } catch (error) {
      this.logger.error('Failed to get user SUI balance:', error);
      return {
        totalBalance: '0',
        coinCount: 0,
      };
    }
  }

  // 📋 지원 확인
  getSupportedOperations() {
    return {
      checkCooldown: true,
      getContributionLevel: !!this.suiConfig.packageId,
      getPoolStatistics: !!this.suiConfig.poolObjectId,
      getRecentDonations: !!this.suiConfig.packageId,
      requestFromOfficialFaucet: true,
      getUserBalance: true,
    };
  }
}