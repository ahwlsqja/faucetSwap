import { Injectable, Logger } from '@nestjs/common';
// import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Temporary mock for Sui SDK until properly installed
class SuiClient {
  constructor(config: any) {}
  async getObject(params: any) { return { data: null }; }
  async queryEvents(params: any) { return { data: [] }; }
  async getLatestSuiSystemState() { return { epoch: '1', protocolVersion: '1' }; }
  async getChainIdentifier() { return 'sui:testnet'; }
  async getOwnedObjects(params: any) { return { data: [] }; }
}

function getFullnodeUrl(network: string) {
  return `https://fullnode.${network}.sui.io:443`;
}

@Injectable()
export class SuiChainService {
  private readonly logger = new Logger(SuiChainService.name);
  private readonly client: SuiClient;
  
  // Sui 설정
  private readonly suiConfig = {
    network: 'testnet', // or 'devnet', 'mainnet'
    rpcUrl: process.env.SUI_RPC_URL || getFullnodeUrl('testnet'),
    packageId: process.env.SUI_PACKAGE_ID || '',
    poolObjectId: process.env.SUI_POOL_OBJECT_ID || '', // Shared FaucetPool object
  };

  // 레벨 계산 상수 (Move 컨트랙트와 동일)
  private readonly LEVEL_THRESHOLDS = {
    BRONZE: 100_000_000, // 0.1 SUI (MIST 단위)
    SILVER: 1_000_000_000, // 1 SUI
    GOLD: 5_000_000_000, // 5 SUI
    DIAMOND: 10_000_000_000, // 10 SUI
  };

  constructor() {
    this.client = new SuiClient({ 
      url: this.suiConfig.rpcUrl 
    });
    this.logger.log(`✅ Sui client initialized for ${this.suiConfig.network}`);
  }

  // 🕒 쿨다운 조회 (핵심 기능)
  async checkCooldown(userAddress: string): Promise<{
    canClaim: boolean;
    remainingTime: number; // milliseconds
    nextClaimTime?: Date;
    lastClaimTime?: Date;
  }> {
    if (!this.suiConfig.poolObjectId) {
      throw new Error('Sui pool object ID not configured');
    }

    try {
      // FaucetPool 객체 조회
      const poolObject = await this.client.getObject({
        id: this.suiConfig.poolObjectId,
        options: { showContent: true }
      });

      if (!poolObject.data?.content || poolObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid pool object');
      }

      const poolData = poolObject.data.content.fields as any;
      const lastClaims = poolData.last_claims?.fields?.contents || [];
      const currentTime = Date.now();
      
      // 사용자의 마지막 클레임 시간 찾기
      const userClaim = lastClaims.find(
        (claim: any) => claim.fields.key === userAddress
      );

      if (!userClaim) {
        // 첫 클레임 - 즉시 가능
        return {
          canClaim: true,
          remainingTime: 0,
        };
      }

      const lastClaimTime = parseInt(userClaim.fields.value);
      const cooldownEndTime = lastClaimTime + 86400000; // 24시간 (ms)
      const remainingTime = Math.max(0, cooldownEndTime - currentTime);
      const canClaim = remainingTime === 0;

      this.logger.log(`🔍 Sui cooldown for ${userAddress}: ${remainingTime}ms remaining`);

      return {
        canClaim,
        remainingTime,
        nextClaimTime: canClaim ? undefined : new Date(cooldownEndTime),
        lastClaimTime: new Date(lastClaimTime),
      };
    } catch (error) {
      this.logger.error('Failed to check Sui cooldown:', error);
      // 에러시 기본값
      return {
        canClaim: false,
        remainingTime: 24 * 60 * 60 * 1000,
      };
    }
  }

  // 🏆 기여도 레벨 조회
  async getContributionLevel(userAddress: string): Promise<{
    level: number;
    levelName: string;
    totalDonated: string; // SUI 단위
    totalDonatedMist: string; // MIST 단위
    nextLevelRequirement?: string;
  }> {
    if (!this.suiConfig.poolObjectId) {
      throw new Error('Sui pool object ID not configured');
    }

    try {
      // FaucetPool 객체 조회
      const poolObject = await this.client.getObject({
        id: this.suiConfig.poolObjectId,
        options: { showContent: true }
      });

      if (!poolObject.data?.content || poolObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid pool object');
      }

      const poolData = poolObject.data.content.fields as any;
      const donations = poolData.donations?.fields?.contents || [];
      
      // 사용자의 총 기부액 찾기
      const userDonation = donations.find(
        (donation: any) => donation.fields.key === userAddress
      );

      const totalDonatedMist = userDonation ? parseInt(userDonation.fields.value) : 0;
      const totalDonated = (totalDonatedMist / 1_000_000_000).toString(); // MIST to SUI

      // 레벨 계산
      let level = 0;
      let levelName = 'None';
      let nextRequirement: number | null = null;

      if (totalDonatedMist >= this.LEVEL_THRESHOLDS.DIAMOND) {
        level = 4;
        levelName = 'Diamond';
      } else if (totalDonatedMist >= this.LEVEL_THRESHOLDS.GOLD) {
        level = 3;
        levelName = 'Gold';
        nextRequirement = this.LEVEL_THRESHOLDS.DIAMOND;
      } else if (totalDonatedMist >= this.LEVEL_THRESHOLDS.SILVER) {
        level = 2;
        levelName = 'Silver';
        nextRequirement = this.LEVEL_THRESHOLDS.GOLD;
      } else if (totalDonatedMist >= this.LEVEL_THRESHOLDS.BRONZE) {
        level = 1;
        levelName = 'Bronze';
        nextRequirement = this.LEVEL_THRESHOLDS.SILVER;
      } else {
        level = 0;
        levelName = 'None';
        nextRequirement = this.LEVEL_THRESHOLDS.BRONZE;
      }

      const nextLevelReq = nextRequirement ? 
        ((nextRequirement - totalDonatedMist) / 1_000_000_000).toString() : 
        undefined;

      this.logger.log(`🏆 Sui contribution for ${userAddress}: Level ${level} (${levelName})`);

      return {
        level,
        levelName,
        totalDonated,
        totalDonatedMist: totalDonatedMist.toString(),
        nextLevelRequirement: nextLevelReq,
      };
    } catch (error) {
      this.logger.error('Failed to get Sui contribution level:', error);
      return {
        level: 0,
        levelName: 'None',
        totalDonated: '0',
        totalDonatedMist: '0',
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
    poolObjectId: string;
  }> {
    if (!this.suiConfig.poolObjectId) {
      throw new Error('Sui pool object ID not configured');
    }

    try {
      // FaucetPool 객체 조회
      const poolObject = await this.client.getObject({
        id: this.suiConfig.poolObjectId,
        options: { showContent: true }
      });

      if (!poolObject.data?.content || poolObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid pool object');
      }

      const poolData = poolObject.data.content.fields as any;
      
      // Balance 객체에서 값 추출
      const currentBalanceMist = parseInt(poolData.balance?.fields?.value || '0');
      const totalDonationsMist = parseInt(poolData.total_donations || '0');
      const totalClaimedMist = parseInt(poolData.total_claimed || '0');
      const faucetAmountMist = parseInt(poolData.faucet_amount || '100000000'); // 기본 0.1 SUI

      // MIST를 SUI로 변환
      const currentBalance = (currentBalanceMist / 1_000_000_000).toString();
      const totalDonations = (totalDonationsMist / 1_000_000_000).toString();
      const totalClaimed = (totalClaimedMist / 1_000_000_000).toString();
      const faucetAmount = (faucetAmountMist / 1_000_000_000).toString();
      
      const availableClaims = faucetAmountMist > 0 ? 
        Math.floor(currentBalanceMist / faucetAmountMist) : 0;

      this.logger.log(`📊 Sui pool stats: ${currentBalance} SUI balance, ${availableClaims} claims available`);

      return {
        currentBalance,
        totalDonations,
        totalClaimed,
        faucetAmount,
        availableClaims,
        poolObjectId: this.suiConfig.poolObjectId,
      };
    } catch (error) {
      this.logger.error('Failed to get Sui pool stats:', error);
      return {
        currentBalance: '0',
        totalDonations: '0',
        totalClaimed: '0',
        faucetAmount: '0.1',
        availableClaims: 0,
        poolObjectId: this.suiConfig.poolObjectId,
      };
    }
  }

  // 📜 최근 기부 내역 조회 (이벤트 기반)
  async getRecentDonations(limit: number = 10): Promise<Array<{
    donor: string;
    amount: string;
    message: string;
    timestamp: Date;
    txHash: string;
  }>> {
    try {
      // DonationReceived 이벤트 조회
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${this.suiConfig.packageId}::sui_faucet::DonationReceived`
        },
        limit,
        order: 'descending'
      });

      const donations = events.data.map(event => {
        const fields = event.parsedJson as any;
        return {
          donor: fields.donor,
          amount: (parseInt(fields.amount) / 1_000_000_000).toString(), // MIST to SUI
          message: Buffer.from(fields.message).toString('utf8'),
          timestamp: new Date(parseInt(event.timestampMs)),
          txHash: event.id.txDigest,
        };
      });

      this.logger.log(`📜 Retrieved ${donations.length} recent donations for Sui`);
      return donations;
    } catch (error) {
      this.logger.error('Failed to get recent Sui donations:', error);
      return [];
    }
  }

  // 🔗 RPC 연결 상태 확인
  async checkConnection(): Promise<{
    connected: boolean;
    epochInfo?: any;
    chainIdentifier?: string;
    error?: string;
  }> {
    try {
      const [epochInfo, chainId] = await Promise.all([
        this.client.getLatestSuiSystemState(),
        this.client.getChainIdentifier(),
      ]);

      return {
        connected: true,
        epochInfo: {
          epoch: epochInfo.epoch,
          protocolVersion: epochInfo.protocolVersion,
        },
        chainIdentifier: chainId,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  // 📋 설정 정보 조회
  getConfig() {
    return {
      network: this.suiConfig.network,
      rpcUrl: this.suiConfig.rpcUrl,
      packageId: this.suiConfig.packageId,
      poolObjectId: this.suiConfig.poolObjectId,
    };
  }

  // 🎯 사용자별 Sui 객체 조회 (추가 기능)
  async getUserSuiObjects(userAddress: string) {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: '0x2::coin::Coin<0x2::sui::SUI>'
        },
        options: {
          showContent: true,
          showType: true,
        }
      });

      const suiCoins = objects.data.map(obj => {
        if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
          const coinData = obj.data.content.fields as any;
          return {
            objectId: obj.data.objectId,
            balance: coinData.balance,
            balanceFormatted: (parseInt(coinData.balance) / 1_000_000_000).toString(),
          };
        }
        return null;
      }).filter(Boolean);

      const totalBalance = suiCoins.reduce((sum, coin) => 
        sum + parseInt(coin.balance), 0
      );

      return {
        coins: suiCoins,
        totalBalance: (totalBalance / 1_000_000_000).toString(),
        coinCount: suiCoins.length,
      };
    } catch (error) {
      this.logger.error('Failed to get user Sui objects:', error);
      return {
        coins: [],
        totalBalance: '0',
        coinCount: 0,
      };
    }
  }
}