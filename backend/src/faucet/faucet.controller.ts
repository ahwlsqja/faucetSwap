import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { FaucetService } from './faucet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FaucetRequestDto, UpdateRequestStatusDto } from './dto/faucet-request.dto';

@ApiTags('Faucet Management')
@Controller('faucet')
export class FaucetController {
  constructor(private readonly faucetService: FaucetService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request tokens from faucet (official or community pool)' })
  @ApiResponse({ status: 201, description: 'Faucet request created successfully' })
  @ApiResponse({ status: 400, description: 'Cooldown active or invalid request' })
  async requestFaucet(
    @Request() req,
    @Body(ValidationPipe) requestDto: FaucetRequestDto,
  ) {
    const userId = req.user.id;
    const { chain, source } = requestDto;
    
    return await this.faucetService.requestFaucet(userId, chain, source);
  }

  @Get('cooldown/:address')
  @ApiOperation({ summary: 'Check cooldown status for user address' })
  @ApiParam({ name: 'address', description: 'User wallet address' })
  @ApiResponse({ status: 200, description: 'Cooldown status retrieved' })
  async getCooldownStatus(
    @Param('address') address: string,
    @Query('chain') chain?: string,
  ) {
    return await this.faucetService.getCooldownStatus(address, chain);
  }

  @Get('history/:address')
  @ApiOperation({ summary: 'Get faucet request history for user' })
  @ApiParam({ name: 'address', description: 'User wallet address' })
  @ApiResponse({ status: 200, description: 'Faucet request history retrieved' })
  async getUserHistory(
    @Param('address') address: string,
    @Query('limit') limit?: number,
  ) {
    const historyLimit = limit || 20;
    return await this.faucetService.getUserHistory(address, historyLimit);
  }

  @Patch('request/:requestId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update faucet request status',
    description: 'Used to mark community pool requests as completed with txHash'
  })
  @ApiParam({ name: 'requestId', description: 'Faucet request ID' })
  async updateRequestStatus(
    @Param('requestId') requestId: string,
    @Body(ValidationPipe) updateDto: UpdateRequestStatusDto,
  ) {
    return await this.faucetService.updateRequestStatus(
      requestId,
      updateDto.status,
      updateDto.txHash,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get faucet usage statistics' })
  @ApiResponse({ status: 200, description: 'Faucet statistics retrieved' })
  async getStatistics() {
    return await this.faucetService.getStatistics();
  }

  // 체인별 상세 쿨다운 정보
  @Get('cooldown/:address/:chain')
  @ApiOperation({ summary: 'Get detailed cooldown info for specific chain' })
  @ApiParam({ name: 'address', description: 'User wallet address' })
  @ApiParam({ name: 'chain', description: 'Chain identifier (ethereum, polygon, sui)' })
  async getChainCooldown(
    @Param('address') address: string,
    @Param('chain') chain: string,
  ) {
    return await this.faucetService.getCooldownStatus(address, chain);
  }

  // 관리자용 - 모든 요청 조회
  @Get('admin/requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all faucet requests (admin only)' })
  async getAllRequests(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('chain') chain?: string,
    @Query('status') status?: string,
  ) {
    // TODO: 관리자 권한 체크 구현 필요
    const pageNum = page || 1;
    const pageLimit = limit || 50;
    const skip = (pageNum - 1) * pageLimit;

    // 기본 필터링 로직 (향후 확장 가능)
    const where: any = {};
    if (chain) where.chain = chain;
    if (status) where.status = status;

    // 임시 구현 - 실제로는 Prisma pagination 사용
    return {
      message: 'Admin endpoint - implementation needed',
      filters: { page: pageNum, limit: pageLimit, chain, status },
    };
  }
}