import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { NFTBadgeService, NFTBadgeMetadata, BadgeEligibility } from './nft-badge.service';

@ApiTags('NFT Badge System')
@Controller('badges')
export class NFTBadgeController {
  constructor(private readonly nftBadgeService: NFTBadgeService) {}

  // 🏆 배지 자격 확인
  @Get('eligibility/:userAddress')
  @ApiOperation({ summary: '사용자의 NFT 배지 자격 확인' })
  @ApiParam({ name: 'userAddress', description: '사용자 지갑 주소' })
  @ApiResponse({ 
    status: 200, 
    description: '배지 자격 정보',
    schema: {
      type: 'object',
      properties: {
        eligible: { type: 'boolean' },
        currentLevel: { type: 'number' },
        nextLevel: { type: 'number', nullable: true },
        requiredAmount: { type: 'string', nullable: true },
        reason: { type: 'string' }
      }
    }
  })
  async checkEligibility(@Param('userAddress') userAddress: string): Promise<BadgeEligibility> {
    return await this.nftBadgeService.checkBadgeEligibility(userAddress);
  }

  // 🎨 배지 메타데이터 생성
  @Get('metadata/:userAddress')
  @ApiOperation({ summary: 'NFT 배지 메타데이터 생성' })
  @ApiParam({ name: 'userAddress', description: '사용자 지갑 주소' })
  @ApiResponse({ 
    status: 200, 
    description: 'NFT 메타데이터 (자격이 있을 경우)',
    schema: {
      type: 'object',
      properties: {
        level: { type: 'number' },
        levelName: { type: 'string' },
        totalDonated: { type: 'string' },
        chainsContributed: { type: 'array', items: { type: 'string' } },
        issuedAt: { type: 'string', format: 'date-time' },
        attributes: { 
          type: 'array', 
          items: {
            type: 'object',
            properties: {
              trait_type: { type: 'string' },
              value: { oneOf: [{ type: 'string' }, { type: 'number' }] }
            }
          }
        }
      }
    }
  })
  async getBadgeMetadata(@Param('userAddress') userAddress: string): Promise<NFTBadgeMetadata | null> {
    return await this.nftBadgeService.generateBadgeMetadata(userAddress);
  }

  // 🔄 배지 업그레이드 체크  
  @Get('upgrade/:userAddress')
  @ApiOperation({ summary: '기존 배지 홀더의 업그레이드 자격 확인' })
  @ApiParam({ name: 'userAddress', description: '사용자 지갑 주소' })
  @ApiResponse({
    status: 200,
    description: '업그레이드 자격 정보',
    schema: {
      type: 'object',
      properties: {
        canUpgrade: { type: 'boolean' },
        newLevel: { type: 'number', nullable: true },
        newLevelName: { type: 'string', nullable: true },
        reason: { type: 'string' }
      }
    }
  })
  async checkUpgrade(
    @Param('userAddress') userAddress: string,
    @Query('currentLevel') currentLevel: string = '0',
  ) {
    return await this.nftBadgeService.checkUpgradeEligibility(
      userAddress, 
      parseInt(currentLevel)
    );
  }

  // 📊 배지 전체 통계 (관리자/대시보드용)
  @Get('statistics')
  @ApiOperation({ summary: 'NFT 배지 발급 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '배지 발급 통계',
    schema: {
      type: 'object',
      properties: {
        totalBadgesIssued: { type: 'number' },
        levelDistribution: { 
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        uniqueHolders: { type: 'number' },
        totalValueDonated: { type: 'string' },
        averageDonationPerBadge: { type: 'string' },
        lastUpdated: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getBadgeStatistics() {
    return await this.nftBadgeService.getBadgeStatistics();
  }

  // 🎯 체인별 배지 정보
  @Get('chain/:chainId/:userAddress')
  @ApiOperation({ summary: '특정 체인에서의 배지 관련 정보 조회' })
  @ApiParam({ name: 'chainId', description: '체인 ID' })
  @ApiParam({ name: 'userAddress', description: '사용자 지갑 주소' })
  @ApiResponse({
    status: 200,
    description: '체인별 배지 정보',
    schema: {
      type: 'object',
      properties: {
        chainId: { type: 'string' },
        contribution: { 
          type: 'object',
          properties: {
            level: { type: 'number' },
            levelName: { type: 'string' },
            totalDonated: { type: 'string' },
            nextLevelRequirement: { type: 'string', nullable: true }
          }
        },
        badgeEligible: { type: 'boolean' },
        chainRanking: {
          type: 'object',
          properties: {
            userRank: { type: 'number' },
            totalContributors: { type: 'number' },
            userInTop10: { type: 'boolean' }
          }
        }
      }
    }
  })
  async getChainBadgeInfo(
    @Param('chainId') chainId: string,
    @Param('userAddress') userAddress: string,
  ) {
    return await this.nftBadgeService.getChainSpecificBadgeInfo(userAddress, chainId);
  }

  // 🏅 리더보드 API
  @Get('leaderboard')
  @ApiOperation({ summary: '전체 기여자 리더보드' })
  @ApiResponse({
    status: 200,
    description: '기여자 순위',
    schema: {
      type: 'object',
      properties: {
        topContributors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              address: { type: 'string' },
              totalDonated: { type: 'string' },
              level: { type: 'number' },
              levelName: { type: 'string' },
              activeChains: { type: 'number' },
              badgeCount: { type: 'number' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' }
          }
        }
      }
    }
  })
  async getLeaderboard(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    // Mock 리더보드 데이터
    // 실제로는 모든 체인의 기여도를 종합해서 순위 계산
    const mockData = {
      topContributors: [
        {
          rank: 1,
          address: '0x742d35Cc9537C0532BC4a9C39E65a12F6b2b4F67',
          totalDonated: '45.7',
          level: 4,
          levelName: 'Diamond',
          activeChains: 5,
          badgeCount: 1,
        },
        {
          rank: 2,
          address: '0x8ba1f109551bD432803012645Hac136c60c01C2F',
          totalDonated: '32.1',
          level: 4,
          levelName: 'Diamond',
          activeChains: 3,
          badgeCount: 1,
        },
        {
          rank: 3,
          address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
          totalDonated: '18.9',
          level: 4,
          levelName: 'Diamond',
          activeChains: 4,
          badgeCount: 1,
        },
        // ... 더 많은 Mock 데이터
      ].slice(0, parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 347,
        totalPages: Math.ceil(347 / parseInt(limit)),
      },
      lastUpdated: new Date(),
    };

    return mockData;
  }

  // 💎 배지 레벨별 요구사항 정보
  @Get('requirements')
  @ApiOperation({ summary: '배지 레벨별 요구사항 조회' })
  @ApiResponse({
    status: 200,
    description: '배지 레벨 요구사항',
    schema: {
      type: 'object',
      properties: {
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              name: { type: 'string' },
              requiredDonation: { type: 'string' },
              description: { type: 'string' },
              benefits: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  })
  async getBadgeRequirements() {
    return {
      levels: [
        {
          level: 1,
          name: 'Bronze',
          requiredDonation: '0.1',
          description: '첫 기부를 통해 커뮤니티에 참여',
          benefits: [
            'Bronze 배지 NFT 발급',
            '기여자 명예의 전당 등록',
            '커뮤니티 Discord 접근'
          ]
        },
        {
          level: 2,
          name: 'Silver',
          requiredDonation: '1.0',
          description: '지속적인 기여를 통한 실버 달성',
          benefits: [
            'Silver 배지 NFT 발급',
            '우선 지원 채널 접근',
            '베타 기능 조기 접근'
          ]
        },
        {
          level: 3,
          name: 'Gold',
          requiredDonation: '5.0',
          description: '상당한 기여를 통한 골드 달성',
          benefits: [
            'Gold 배지 NFT 발급',
            '커뮤니티 거버넌스 참여',
            '특별 이벤트 초대'
          ]
        },
        {
          level: 4,
          name: 'Diamond',
          requiredDonation: '10.0',
          description: '최고 수준의 기여자',
          benefits: [
            'Diamond 배지 NFT 발급',
            '커뮤니티 운영진 후보',
            '연간 기여자 시상식 참여',
            '맞춤형 지원 서비스'
          ]
        }
      ],
      currency: 'testnet tokens equivalent',
      lastUpdated: new Date(),
    };
  }
}