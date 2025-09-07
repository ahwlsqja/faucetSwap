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
  Logger,
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
  private readonly logger = new Logger(ChainManagerController.name);

  constructor(
    private readonly chainManager: ChainManager,
    private readonly chainRegistry: ChainRegistryService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get all chains status and statistics' })
  @ApiResponse({ status: 200, description: 'Chains status retrieved', type: AllChainsStatusDto })
  async getAllChainsStatus(): Promise<AllChainsStatusDto> {
    const statistics = await this.chainManager.getChainStatistics();
    const chains = Object.entries(statistics).map(([chainId, stats]) => ({
      chainId,
      ...(stats as any),
      isActive: !(stats as any)?.error,
    }));

    return {
      chains,
      totalChains: chains.length,
      activeChains: chains.filter(c => c.isActive).length,
      lastUpdated: new Date(),
    };
  }

  @Get('status/:chainId')
  @ApiOperation({ summary: 'Get specific chain status and statistics' })
  @ApiParam({ name: 'chainId', description: 'Chain identifier' })
  @ApiResponse({ status: 200, description: 'Chain status retrieved', type: ChainStatusDto })
  async getChainStatus(@Param('chainId') chainId: string): Promise<ChainStatusDto> {
    const statistics = await this.chainManager.getChainStatistics(chainId);
    
    if (!statistics) {
      throw new Error(`Chain ${chainId} not found`);
    }

    return {
      chainId,
      ...(statistics as any),
      isActive: !(statistics as any)?.error,
    };
  }

  @Get('supported')
  @ApiOperation({ summary: 'Get list of supported chains with configurations' })
  @ApiResponse({ status: 200, description: 'Supported chains list' })
  async getSupportedChains() {
    const chains = this.chainManager.getSupportedChains();
    const configs = this.chainManager.getAllChainConfigs();
    
    return {
      chains,
      configs,
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
    const donations = await this.chainManager.getAllRecentActivity(100);
    
    // 필터링 로직
    let filtered = donations;
    
    if (query.chain) {
      filtered = filtered.filter(d => d.chainId === query.chain);
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
  @ApiOperation({ summary: 'Process a donation transaction (DEPRECATED)' })
  @ApiResponse({ status: 201, description: 'Donation processed successfully' })
  async processDonation(@Body(ValidationPipe) processDonationDto: ProcessDonationDto) {
    const { donor, chain, amount, txHash, message } = processDonationDto;
    
    // 이제 프론트엔드에서 직접 컨트랙트를 호출하므로 단순 로깅만
    this.logger.log(`📝 Donation recorded: ${amount} on ${chain} from ${donor}`);
    
    return {
      success: true,
      chain,
      donor,
      amount,
      txHash,
      message,
      processedAt: new Date(),
      note: 'Donation should be processed directly by smart contract',
    };
  }

  @Post('distribute')
  @ApiOperation({ summary: 'Request token distribution (DEPRECATED)' })
  @ApiResponse({ status: 201, description: 'Distribution request logged' })
  async distributeTokens(@Body(ValidationPipe) distributeDto: DistributeTokensDto) {
    const { recipient, chain, amount, reason } = distributeDto;
    
    // 백엔드는 요청만 로깅, 실제 분배는 프론트엔드에서 직접 컨트랙트 호출
    this.logger.log(`📝 Distribution request: ${amount} to ${recipient} on ${chain}`);
    
    return {
      success: true,
      chain,
      recipient,
      amount,
      reason,
      txHash: `request_${chain}_${Date.now()}`,
      distributedAt: new Date(),
      note: 'User should call smart contract directly from frontend',
    };
  }

  @Post('distribute/batch')
  @ApiOperation({ summary: 'Batch distribute tokens (DEPRECATED)' })
  @ApiResponse({ status: 201, description: 'Batch distribution request logged' })
  async batchDistribute(@Body(ValidationPipe) batchDto: BatchDistributeDto) {
    const { chain, distributions, batchReason } = batchDto;
    
    this.logger.log(`📝 Batch distribution request on ${chain}: ${distributions.length} recipients`);

    const results = distributions.map(dist => ({
      recipient: dist.recipient,
      amount: dist.amount,
      success: true,
      txHash: `request_${chain}_${Date.now()}`,
      note: 'User should call smart contract directly',
    }));
    
    return {
      chain,
      batchReason,
      results,
      distributedAt: new Date(),
      note: 'Batch distribution should be handled by smart contract directly',
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
    const statistics = await this.chainManager.getChainStatistics(chainId);
    const recentActivity = await this.chainManager.getAllRecentActivity(50);
    
    const chainActivity = recentActivity.filter(activity => activity.chainId === chainId);
    const uniqueDonors = new Set(chainActivity.map(d => d.donor)).size;
    const totalAmount = chainActivity.reduce((sum, d) => sum + parseFloat(d.amount), 0).toString();
    
    return {
      totalDonations: chainActivity.length,
      totalAmount,
      totalDistributed: statistics?.statistics?.totalClaimed || '0',
      availableBalance: statistics?.statistics?.currentBalance || '0',
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
  ) {
    return await this.chainManager.checkFaucetCooldown(chainId, userAddress);
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
  ) {
    return await this.chainManager.getUserContribution(chainId, userAddress);
  }

  // 📊 NEW: 풀 통계 APIs
  @Get(':chainId/pool-statistics')
  @ApiOperation({ summary: '특정 체인의 풀 통계 조회' })
  @ApiParam({ name: 'chainId', description: '체인 ID' })
  @ApiResponse({ type: PoolStatisticsDto })
  async getPoolStatistics(
    @Param('chainId') chainId: string,
  ) {
    const statistics = await this.chainManager.getChainStatistics(chainId);
    return statistics?.statistics || {
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
    const cooldowns: Record<string, any> = {};

    for (const chainId of chains) {
      try {
        cooldowns[chainId] = await this.chainManager.checkFaucetCooldown(chainId, userAddress);
      } catch (error) {
        cooldowns[chainId] = {
          canClaim: false,
          remainingTime: 86400000,
          error: error.message,
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
    const contributions: Record<string, any> = {};
    let totalLevel = 0;
    let totalDonated = 0;

    for (const chainId of chains) {
      try {
        const contribution = await this.chainManager.getUserContribution(chainId, userAddress);
        contributions[chainId] = contribution;
        totalLevel = Math.max(totalLevel, contribution.level);
        totalDonated += parseFloat(contribution.totalDonated || '0');
      } catch (error) {
        contributions[chainId] = {
          level: 0,
          levelName: 'None',
          totalDonated: '0',
          error: error.message,
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

  // 📜 NEW: 모든 체인의 최근 활동 조회
  @Get('recent-activity')
  @ApiOperation({ summary: '모든 체인에서 최근 활동 내역 조회' })
  @ApiResponse({ status: 200, description: 'Recent activity across all chains' })
  async getRecentActivity(@Query('limit') limit: number = 20) {
    return await this.chainManager.getAllRecentActivity(limit);
  }

  // 🏆 NEW: 체인별 상위 기부자 랭킹
  @Get(':chainId/rankings')
  @ApiOperation({ summary: '특정 체인의 상위 기부자 랭킹 조회' })
  @ApiParam({ name: 'chainId', description: '체인 ID' })
  async getChainRankings(
    @Param('chainId') chainId: string,
    @Query('limit') limit: number = 10,
  ) {
    return await this.chainManager.getUserRanking(chainId, limit);
  }
}