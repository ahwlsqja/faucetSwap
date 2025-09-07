import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChainManager } from '../chains/chain-manager.service';

@Injectable()
export class FaucetService {
  private readonly logger = new Logger(FaucetService.name);

  constructor(
    private prisma: PrismaService,
    private chainManager: ChainManager,
  ) {}

  async requestFaucet(userId: string, chain: string, source: 'OFFICIAL_FAUCET' | 'COMMUNITY_POOL') {
    // 1. 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 2. 체인 설정 확인 (DB에서 가져오기)
    const faucetConfig = await this.prisma.faucetConfig.findUnique({
      where: { chain }
    });
    
    if (!faucetConfig) {
      throw new BadRequestException(`Chain ${chain} not configured in database`);
    }

    const chainConfig = this.chainManager.getChainConfig(chain);
    if (!chainConfig) {
      throw new BadRequestException(`Unsupported chain: ${chain}`);
    }

    // 3. 쿨다운 체크 (DB 기반 통합 쿨다운)
    await this.checkCooldown(userId, chain);

    // 4. 동적 쿨다운 시간 계산
    const cooldownMs = faucetConfig.cooldownHours * 60 * 60 * 1000;
    const cooldownUntil = new Date(Date.now() + cooldownMs);

    // 5. 요청 기록 생성
    const request = await this.prisma.faucetRequest.create({
      data: {
        userId,
        chain,
        token: faucetConfig.token,
        amount: faucetConfig.maxAmount,
        source,
        status: source === 'OFFICIAL_FAUCET' ? 'PENDING' : 'PROCESSING',
        requestedAt: new Date(),
        cooldownUntil,
      },
    });

    this.logger.log(`💧 Faucet request created: ${source} for ${chain} by ${user.address}`);

    if (source === 'OFFICIAL_FAUCET') {
      // 공식 파우셋: 외부 URL 반환
      return {
        success: true,
        requestId: request.id,
        redirectUrl: chainConfig.faucetUrl,
        message: 'Redirecting to official faucet',
        cooldownUntil: request.cooldownUntil,
      };
    } else {
      // 커뮤니티 풀: 컨트랙트 정보 반환
      return {
        success: true,
        requestId: request.id,
        contractCall: true,
        message: 'Call smart contract directly',
        cooldownUntil: request.cooldownUntil,
        contractInfo: await this.getContractInfo(chain),
      };
    }
  }

  async checkCooldown(userId: string, chain: string) {
    const lastRequest = await this.prisma.faucetRequest.findFirst({
      where: {
        userId,
        chain,
        cooldownUntil: {
          gt: new Date(), // 아직 쿨다운 중
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    if (lastRequest) {
      const remainingMs = lastRequest.cooldownUntil.getTime() - Date.now();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      
      throw new BadRequestException(
        `Cooldown active. Try again in ${remainingHours} hours`
      );
    }
  }

  async getCooldownStatus(userAddress: string, chain?: string) {
    // 사용자 찾기
    const user = await this.prisma.user.findUnique({
      where: { address: userAddress.toLowerCase() }
    });

    if (!user) {
      // 사용자가 없으면 모든 체인에서 사용 가능
      const chains = chain ? [chain] : this.chainManager.getSupportedChains();
      const result = {};
      
      for (const chainId of chains) {
        result[chainId] = {
          canClaim: true,
          remainingTime: 0,
          lastRequest: null,
        };
      }
      
      return chain ? result[chain] : result;
    }

    // 체인별 쿨다운 상태 확인
    const chains = chain ? [chain] : this.chainManager.getSupportedChains();
    const result = {};

    for (const chainId of chains) {
      const lastRequest = await this.prisma.faucetRequest.findFirst({
        where: {
          userId: user.id,
          chain: chainId,
        },
        orderBy: { requestedAt: 'desc' },
      });

      if (!lastRequest) {
        result[chainId] = {
          canClaim: true,
          remainingTime: 0,
          lastRequest: null,
        };
      } else {
        const now = new Date();
        const canClaim = !lastRequest.cooldownUntil || lastRequest.cooldownUntil <= now;
        const remainingTime = canClaim ? 0 : lastRequest.cooldownUntil.getTime() - now.getTime();

        result[chainId] = {
          canClaim,
          remainingTime,
          lastRequest: {
            id: lastRequest.id,
            source: lastRequest.source,
            status: lastRequest.status,
            requestedAt: lastRequest.requestedAt,
            completedAt: lastRequest.completedAt,
          },
        };
      }
    }

    return chain ? result[chain] : result;
  }

  async updateRequestStatus(requestId: string, status: string, txHash?: string) {
    const request = await this.prisma.faucetRequest.update({
      where: { id: requestId },
      data: {
        status,
        txHash,
        completedAt: status === 'SUCCESS' ? new Date() : undefined,
      },
      include: {
        user: true,
      },
    });

    this.logger.log(`📝 Request ${requestId} updated to ${status}`);
    return request;
  }

  async getUserHistory(userAddress: string, limit: number = 20) {
    const user = await this.prisma.user.findUnique({
      where: { address: userAddress.toLowerCase() }
    });

    if (!user) {
      return [];
    }

    return await this.prisma.faucetRequest.findMany({
      where: { userId: user.id },
      orderBy: { requestedAt: 'desc' },
      take: limit,
    });
  }

  private async getContractInfo(chain: string) {
    // 체인별 컨트랙트 정보 반환 (환경변수에서 가져와야 함)
    const contractAddresses = {
      ethereum: process.env.ETHEREUM_CONTRACT,
      polygon: process.env.POLYGON_CONTRACT,
      sui: process.env.SUI_PACKAGE_ID,
    };

    return {
      contractAddress: contractAddresses[chain],
      method: 'requestFaucet',
      abi: 'AutoFaucetPool', // 실제로는 전체 ABI 필요
    };
  }

  // 통계 조회
  async getStatistics() {
    const stats = await this.prisma.faucetRequest.groupBy({
      by: ['chain', 'source', 'status'],
      _count: {
        id: true,
      },
    });

    const totalRequests = await this.prisma.faucetRequest.count();
    const successfulRequests = await this.prisma.faucetRequest.count({
      where: { status: 'SUCCESS' }
    });

    return {
      totalRequests,
      successfulRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      breakdown: stats,
    };
  }
}