import { Injectable, Logger } from '@nestjs/common';
import { ChainManager } from '../chains/chain-manager.service';

export interface NFTBadgeMetadata {
  level: number;
  levelName: string;
  totalDonated: string;
  chainsContributed: string[];
  issuedAt: Date;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface BadgeEligibility {
  eligible: boolean;
  currentLevel: number;
  nextLevel?: number;
  requiredAmount?: string;
  reason?: string;
}

@Injectable()
export class NFTBadgeService {
  private readonly logger = new Logger(NFTBadgeService.name);

  constructor(private readonly chainManager: ChainManager) {}

  // 🏆 사용자의 NFT 배지 자격 확인
  async checkBadgeEligibility(userAddress: string): Promise<BadgeEligibility> {
    try {
      const chains = this.chainManager.getSupportedChains();
      let highestLevel = 0;
      let totalDonated = 0;
      const activeChains: string[] = [];

      for (const chainId of chains) {
        try {
          const contribution = await this.chainManager.getUserContribution(chainId, userAddress);
          
          if (contribution.level > 0) {
            activeChains.push(chainId);
            highestLevel = Math.max(highestLevel, contribution.level);
            totalDonated += parseFloat(contribution.totalDonated);
          }
        } catch (error) {
          this.logger.warn(`Failed to check ${chainId} contribution:`, error.message);
        }
      }

      const thresholds = [
        { level: 1, name: 'Bronze', required: 0.1 },
        { level: 2, name: 'Silver', required: 1.0 },
        { level: 3, name: 'Gold', required: 5.0 },
        { level: 4, name: 'Diamond', required: 10.0 },
      ];

      const currentThreshold = thresholds.find(t => t.level === highestLevel);
      const nextThreshold = thresholds.find(t => t.level === highestLevel + 1);

      const eligible = highestLevel > 0;

      return {
        eligible,
        currentLevel: highestLevel,
        nextLevel: nextThreshold?.level,
        requiredAmount: nextThreshold ? (nextThreshold.required - totalDonated).toString() : undefined,
        reason: eligible ? 
          `Qualified for ${currentThreshold?.name || 'Bronze'} badge` : 
          'No contributions found across any chain',
      };

    } catch (error) {
      this.logger.error('Failed to check badge eligibility:', error);
      return {
        eligible: false,
        currentLevel: 0,
        reason: 'Error checking eligibility',
      };
    }
  }

  // 🎨 NFT 메타데이터 생성
  async generateBadgeMetadata(userAddress: string): Promise<NFTBadgeMetadata | null> {
    const eligibility = await this.checkBadgeEligibility(userAddress);
    
    if (!eligibility.eligible) {
      return null;
    }

    const chains = this.chainManager.getSupportedChains();
    const contributedChains: string[] = [];
    let totalAcrossChains = 0;

    for (const chainId of chains) {
      try {
        const contribution = await this.chainManager.getUserContribution(chainId, userAddress);
        
        if (contribution.level > 0) {
          contributedChains.push(chainId);
          totalAcrossChains += parseFloat(contribution.totalDonated);
        }
      } catch (error) {
        this.logger.warn(`Failed to get ${chainId} contribution:`, error.message);
      }
    }

    const levelNames = ['None', 'Bronze', 'Silver', 'Gold', 'Diamond'];
    const levelName = levelNames[eligibility.currentLevel] || 'Bronze';

    return {
      level: eligibility.currentLevel,
      levelName,
      totalDonated: totalAcrossChains.toString(),
      chainsContributed: contributedChains,
      issuedAt: new Date(),
      attributes: [
        {
          trait_type: 'Contributor Level',
          value: levelName,
        },
        {
          trait_type: 'Total Donated',
          value: totalAcrossChains,
        },
        {
          trait_type: 'Chains Contributed',
          value: contributedChains.length,
        },
        {
          trait_type: 'Active Chains',
          value: contributedChains.join(', '),
        },
        {
          trait_type: 'Issue Date',
          value: new Date().toISOString().split('T')[0],
        },
      ],
    };
  }

  // 📊 배지 통계 생성 (관리자용)
  async getBadgeStatistics() {
    try {
      // 실제로는 데이터베이스에서 발급된 배지 통계를 조회
      // 여기서는 Mock 데이터 제공
      return {
        totalBadgesIssued: 125,
        levelDistribution: {
          Bronze: 45,
          Silver: 35,
          Gold: 25,
          Diamond: 20,
        },
        uniqueHolders: 125,
        totalValueDonated: '847.5', // 모든 레벨의 총 기부액
        averageDonationPerBadge: '6.78',
        mostActiveChains: [
          { chain: 'ethereum', holders: 78 },
          { chain: 'polygon', holders: 52 },
          { chain: 'sui', holders: 31 },
        ],
        recentIssues: [
          {
            userAddress: '0x123...',
            level: 3,
            levelName: 'Gold',
            issuedAt: new Date(),
          },
        ],
        lastUpdated: new Date(),
      };

    } catch (error) {
      this.logger.error('Failed to get badge statistics:', error);
      return {
        totalBadgesIssued: 0,
        levelDistribution: {},
        uniqueHolders: 0,
        totalValueDonated: '0',
        lastUpdated: new Date(),
      };
    }
  }

  // 🔄 배지 업그레이드 확인 (기존 홀더용)
  async checkUpgradeEligibility(
    userAddress: string,
    currentBadgeLevel: number,
  ): Promise<{
    canUpgrade: boolean;
    newLevel?: number;
    newLevelName?: string;
    reason?: string;
  }> {
    const eligibility = await this.checkBadgeEligibility(userAddress);
    
    if (eligibility.currentLevel > currentBadgeLevel) {
      const levelNames = ['None', 'Bronze', 'Silver', 'Gold', 'Diamond'];
      
      return {
        canUpgrade: true,
        newLevel: eligibility.currentLevel,
        newLevelName: levelNames[eligibility.currentLevel],
        reason: `Eligible for upgrade to ${levelNames[eligibility.currentLevel]}`,
      };
    }

    return {
      canUpgrade: false,
      reason: eligibility.requiredAmount ? 
        `Need ${eligibility.requiredAmount} more to upgrade` : 
        'Already at highest level',
    };
  }

  // 🎯 특정 체인에서의 기여도 기반 배지 체크
  async getChainSpecificBadgeInfo(userAddress: string, chainId: string) {
    try {
      const contribution = await this.chainManager.getUserContribution(chainId, userAddress);
      const statistics = await this.chainManager.getChainStatistics(chainId);
      const poolStats = statistics?.statistics || null;

      return {
        chainId,
        contribution,
        poolStats,
        badgeEligible: contribution.level > 0,
        chainRanking: await this.getChainRanking(chainId, userAddress),
      };

    } catch (error) {
      this.logger.error(`Failed to get ${chainId} badge info:`, error);
      return {
        chainId,
        badgeEligible: false,
        error: error.message,
      };
    }
  }

  // 🏅 체인별 기여자 순위 (상위 10명)
  private async getChainRanking(chainId: string, userAddress: string) {
    // 실제로는 해당 체인의 모든 기부자 데이터를 조회해서 순위 계산
    // 여기서는 Mock 데이터
    return {
      userRank: 5,
      totalContributors: 127,
      topContributors: [
        { address: '0xabc...', donated: '15.5', level: 4 },
        { address: '0xdef...', donated: '12.3', level: 4 },
        { address: '0x123...', donated: '8.7', level: 3 },
        // ... 더 많은 데이터
      ],
      userInTop10: true,
    };
  }
}