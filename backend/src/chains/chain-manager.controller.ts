import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChainManager } from './chain-manager.service';
import { ChainRegistryService } from './chain-registry.service';
import {
  AddChainDto,
  RemoveChainDto,
  UpdateChainDto,
} from './dto/add-chain.dto';
import {
  ProcessDonationDto,
  DistributeTokensDto,
  BatchDistributeDto,
  CrossChainDistributeDto,
  DonationHistoryQueryDto,
} from './dto/donation.dto';
import {
  ChainStatusDto,
  AllChainsStatusDto,
  ChainStatsDto,
} from './dto/chain-status.dto';
import { CooldownInfoDto, ContributionLevelDto, PoolStatisticsDto } from './dto/cooldown-info.dto';

@ApiTags('Chain Management')
@Controller('chains')
export class ChainManagerController {
  constructor(
    private readonly chainManager: ChainManager,
    private readonly chainRegistry: ChainRegistryService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get all chains status' })
  @ApiResponse({ status: 200, description: 'Chains status retrieved', type: AllChainsStatusDto })
  async getAllChainsStatus(): Promise<AllChainsStatusDto> {
    const statuses = await this.chainManager.getPoolStatuses();
    const chains = Object.entries(statuses).map(([chainId, status]) => ({
      chainId,
      ...status,
    }));

    return {
      chains,
      totalChains: chains.length,
      activeChains: chains.filter(c => c.isActive).length,
      lastUpdated: new Date(),
    };
  }

  @Get('status/:chainId')
  @ApiOperation({ summary: 'Get specific chain status' })
  @ApiParam({ name: 'chainId', description: 'Chain identifier' })
  @ApiResponse({ status: 200, description: 'Chain status retrieved', type: ChainStatusDto })
  async getChainStatus(@Param('chainId') chainId: string): Promise<ChainStatusDto> {
    const statuses = await this.chainManager.getPoolStatuses();
    const status = statuses[chainId];
    
    if (!status) {
      throw new Error(`Chain ${chainId} not found`);
    }

    return {
      chainId,
      ...status,
    };
  }

  @Get('supported')
  @ApiOperation({ summary: 'Get list of supported chains' })
  @ApiResponse({ status: 200, description: 'Supported chains list' })
  async getSupportedChains() {
    const chains = this.chainManager.getSupportedChains();
    const types = this.chainManager.getChainTypes();
    
    return {
      chains,
      types,
      count: chains.length,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for all chains' })
  @ApiResponse({ status: 200, description: 'Health check results' })
  async healthCheck() {
    return await this.chainManager.healthCheck();
  }

  @Post()
  @ApiOperation({ summary: 'Add new chain' })
  @ApiResponse({ status: 201, description: 'Chain added successfully' })
  async addChain(@Body(ValidationPipe) addChainDto: AddChainDto) {
    return await this.chainRegistry.addNewChain(addChainDto);
  }

  @Delete(':chainId')
  @ApiOperation({ summary: 'Remove chain' })
  @ApiParam({ name: 'chainId', description: 'Chain identifier to remove' })
  @ApiResponse({ status: 200, description: 'Chain removed successfully' })
  async removeChain(@Param('chainId') chainId: string) {
    await this.chainRegistry.removeChain(chainId);
    return { success: true, message: `Chain ${chainId} removed` };
  }

  @Patch(':chainId')
  @ApiOperation({ summary: 'Update chain configuration' })
  @ApiParam({ name: 'chainId', description: 'Chain identifier' })
  async updateChain(
    @Param('chainId') chainId: string,
    @Body(ValidationPipe) updateChainDto: UpdateChainDto,
  ) {
    // 업데이트 로직 구현 필요
    return { success: true, message: `Chain ${chainId} updated` };
  }

  @Get('donations')
  @ApiOperation({ summary: 'Get donation history across all chains' })
  @ApiResponse({ status: 200, description: 'Donation history retrieved' })
  async getAllDonations(@Query() query: DonationHistoryQueryDto) {
    const donations = await this.chainManager.getAllDonations();
    
    // 필터링 로직
    let filtered = donations;
    
    if (query.chain) {
      filtered = filtered.filter(d => d.chain === query.chain);
    }
    
    if (query.donor) {
      filtered = filtered.filter(d => d.donor.toLowerCase() === query.donor.toLowerCase());
    }
    
    if (query.startDate) {
      const start = new Date(query.startDate);
      filtered = filtered.filter(d => d.timestamp >= start);
    }
    
    if (query.endDate) {
      const end = new Date(query.endDate);
      filtered = filtered.filter(d => d.timestamp <= end);
    }

    // 페이징
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    
    const paginatedDonations = filtered.slice(skip, skip + limit);
    
    return {
      donations: paginatedDonations,
      pagination: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  @Post('donations/process')
  @ApiOperation({ summary: 'Process a donation transaction' })
  @ApiResponse({ status: 201, description: 'Donation processed successfully' })
  async processDonation(@Body(ValidationPipe) processDonationDto: ProcessDonationDto) {
    const { donor, chain, amount, txHash, message } = processDonationDto;
    
    const module = this.chainManager.getChainModule(chain);
    if (!module) {
      throw new Error(`Chain ${chain} not supported`);
    }

    const success = await module.processDonation(donor, amount, txHash);
    
    return {
      success,
      chain,
      donor,
      amount,
      txHash,
      message,
      processedAt: new Date(),
    };
  }

  @Post('distribute')
  @ApiOperation({ summary: 'Distribute tokens to recipient' })
  @ApiResponse({ status: 201, description: 'Tokens distributed successfully' })
  async distributeTokens(@Body(ValidationPipe) distributeDto: DistributeTokensDto) {
    const { recipient, chain, amount, reason } = distributeDto;
    
    const module = this.chainManager.getChainModule(chain);
    if (!module) {
      throw new Error(`Chain ${chain} not supported`);
    }

    const txHash = await module.distributeTokens(recipient, amount, reason);
    
    return {
      success: true,
      chain,
      recipient,
      amount,
      reason,
      txHash,
      distributedAt: new Date(),
    };
  }

  @Post('distribute/batch')
  @ApiOperation({ summary: 'Batch distribute tokens on single chain' })
  @ApiResponse({ status: 201, description: 'Batch distribution completed' })
  async batchDistribute(@Body(ValidationPipe) batchDto: BatchDistributeDto) {
    const { chain, distributions, batchReason } = batchDto;
    
    const module = this.chainManager.getChainModule(chain);
    if (!module) {
      throw new Error(`Chain ${chain} not supported`);
    }

    const results = [];
    
    for (const dist of distributions) {
      try {
        const txHash = await module.distributeTokens(
          dist.recipient,
          dist.amount,
          dist.reason || batchReason || 'Batch distribution'
        );
        
        results.push({
          recipient: dist.recipient,
          amount: dist.amount,
          success: true,
          txHash,
        });
      } catch (error) {
        results.push({
          recipient: dist.recipient,
          amount: dist.amount,
          success: false,
          error: error.message,
        });
      }
    }
    
    return {
      chain,
      batchReason,
      results,
      distributedAt: new Date(),
    };
  }

  // 더 이상 사용안함 - 컨트랙트에서 자동 처리
  @Post('distribute/cross-chain')
  @ApiOperation({ summary: 'Cross-chain token distribution (DEPRECATED)' })
  @ApiResponse({ status: 400, description: 'Distribution handled by smart contracts' })
  async crossChainDistribute(@Body(ValidationPipe) crossChainDto: CrossChainDistributeDto) {
    throw new Error('Distribution is now handled directly by smart contracts');
  }

  @Get(':chainId/stats')
  @ApiOperation({ summary: 'Get chain-specific statistics' })
  @ApiParam({ name: 'chainId', description: 'Chain identifier' })
  @ApiResponse({ status: 200, description: 'Chain statistics', type: ChainStatsDto })
  async getChainStats(@Param('chainId') chainId: string): Promise<ChainStatsDto> {
    const module = this.chainManager.getChainModule(chainId);
    if (!module) {
      throw new Error(`Chain ${chainId} not found`);
    }

    const donations = await module.getDonationHistory(1000);
    const availableBalance = await module.getAvailableBalance();
    
    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0).toString();
    const uniqueDonors = new Set(donations.map(d => d.donor)).size;
    
    return {
      totalDonations: donations.length,
      totalAmount,
      totalDistributed: '0', // 구현 필요
      availableBalance,
      donorCount: uniqueDonors,
    };
  }

  // 🕒 NEW: 쿨다운 조회 APIs
  @Get(':chainId/cooldown/:userAddress')
  @ApiOperation({ summary: '특정 체인에서 사용자의 쿨다운 정보 조회' })
  @ApiParam({ name: 'chainId', description: '체인 ID (예: ethereum, sui)' })
  @ApiParam({ name: 'userAddress', description: '사용자 지갑 주소' })
  @ApiResponse({ type: CooldownInfoDto })
  async getCooldownInfo(
    @Param('chainId') chainId: string,
    @Param('userAddress') userAddress: string,
  ): Promise<CooldownInfoDto> {
    const module = this.chainManager.getChainModule(chainId);
    if (!module) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    // 체인 모듈에 getCooldownInfo 메서드가 있는지 확인
    if ('getCooldownInfo' in module && typeof module.getCooldownInfo === 'function') {
      return await (module as any).getCooldownInfo(userAddress);
    }

    // 기본값 반환
    return {
      canClaim: false,
      remainingTime: 86400000, // 24시간
    };
  }

  // 🏆 NEW: 기여도 조회 APIs  
  @Get(':chainId/contribution/:userAddress')
  @ApiOperation({ summary: '특정 체인에서 사용자의 기여도 레벨 조회' })
  @ApiParam({ name: 'chainId', description: '체인 ID' })
  @ApiParam({ name: 'userAddress', description: '사용자 지갑 주소' })
  @ApiResponse({ type: ContributionLevelDto })
  async getContributionLevel(
    @Param('chainId') chainId: string,
    @Param('userAddress') userAddress: string,
  ): Promise<ContributionLevelDto> {
    const module = this.chainManager.getChainModule(chainId);
    if (!module) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    if ('getContributionLevel' in module && typeof module.getContributionLevel === 'function') {
      return await (module as any).getContributionLevel(userAddress);
    }

    return {
      level: 0,
      levelName: 'None', 
      totalDonated: '0',
      nextLevelRequirement: '0.1'
    };
  }

  // 📊 NEW: 풀 통계 APIs
  @Get(':chainId/pool-statistics')
  @ApiOperation({ summary: '특정 체인의 풀 통계 조회' })
  @ApiParam({ name: 'chainId', description: '체인 ID' })
  @ApiResponse({ type: PoolStatisticsDto })
  async getPoolStatistics(
    @Param('chainId') chainId: string,
  ): Promise<PoolStatisticsDto> {
    const module = this.chainManager.getChainModule(chainId);
    if (!module) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    if ('getPoolStatistics' in module && typeof module.getPoolStatistics === 'function') {
      return await (module as any).getPoolStatistics();
    }

    return {
      currentBalance: '0',
      totalDonations: '0',
      totalClaimed: '0',
      faucetAmount: '0.1',
      availableClaims: 0,
    };
  }

  // 🔍 NEW: 다중 체인 쿨다운 조회 (대시보드용)
  @Get('multi-cooldown/:userAddress')
  @ApiOperation({ summary: '모든 체인에서 사용자의 쿨다운 상태 조회' })
  @ApiParam({ name: 'userAddress', description: '사용자 지갑 주소' })
  async getMultiChainCooldown(
    @Param('userAddress') userAddress: string,
  ) {
    const chains = this.chainManager.getSupportedChains();
    const cooldowns: Record<string, CooldownInfoDto> = {};

    for (const chainId of chains) {
      try {
        const module = this.chainManager.getChainModule(chainId);
        if (module && 'getCooldownInfo' in module) {
          cooldowns[chainId] = await (module as any).getCooldownInfo(userAddress);
        }
      } catch (error) {
        cooldowns[chainId] = {
          canClaim: false,
          remainingTime: 86400000,
        };
      }
    }

    return {
      userAddress,
      cooldowns,
      checkedAt: new Date(),
    };
  }

  // 🏆 NEW: 다중 체인 기여도 조회 (대시보드용)
  @Get('multi-contribution/:userAddress')
  @ApiOperation({ summary: '모든 체인에서 사용자의 기여도 조회' })
  @ApiParam({ name: 'userAddress', description: '사용자 지갑 주소' })
  async getMultiChainContribution(
    @Param('userAddress') userAddress: string,
  ) {
    const chains = this.chainManager.getSupportedChains();
    const contributions: Record<string, ContributionLevelDto> = {};
    let totalLevel = 0;
    let totalDonated = 0;

    for (const chainId of chains) {
      try {
        const module = this.chainManager.getChainModule(chainId);
        if (module && 'getContributionLevel' in module) {
          const contribution = await (module as any).getContributionLevel(userAddress);
          contributions[chainId] = contribution;
          totalLevel = Math.max(totalLevel, contribution.level);
          totalDonated += parseFloat(contribution.totalDonated);
        }
      } catch (error) {
        contributions[chainId] = {
          level: 0,
          levelName: 'None',
          totalDonated: '0',
        };
      }
    }

    const levelNames = ['None', 'Bronze', 'Silver', 'Gold', 'Diamond'];

    return {
      userAddress,
      contributions,
      summary: {
        highestLevel: totalLevel,
        highestLevelName: levelNames[totalLevel] || 'None',
        totalDonatedAcrossChains: totalDonated.toString(),
        activeChains: Object.keys(contributions).filter(
          chainId => contributions[chainId].level > 0
        ).length,
      },
      checkedAt: new Date(),
    };
  }
}