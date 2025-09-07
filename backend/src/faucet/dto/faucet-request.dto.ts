import { IsString, IsEnum, IsOptional, IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FaucetSource {
  OFFICIAL_FAUCET = 'OFFICIAL_FAUCET',
  COMMUNITY_POOL = 'COMMUNITY_POOL',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class FaucetRequestDto {
  @ApiProperty({ 
    description: 'Chain identifier',
    example: 'ethereum',
    enum: ['ethereum', 'polygon', 'sui']
  })
  @IsString()
  chain: string;

  @ApiProperty({
    description: 'Faucet source type',
    enum: FaucetSource,
    example: FaucetSource.COMMUNITY_POOL,
  })
  @IsEnum(FaucetSource)
  source: FaucetSource;
}

export class UpdateRequestStatusDto {
  @ApiProperty({
    description: 'New request status',
    enum: RequestStatus,
    example: RequestStatus.SUCCESS,
  })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @ApiProperty({
    description: 'Transaction hash if successful',
    example: '0x1234567890abcdef...',
    required: false,
  })
  @IsOptional()
  @IsString()
  txHash?: string;
}

export class CooldownInfoDto {
  @ApiProperty({ description: 'Whether user can claim tokens' })
  canClaim: boolean;

  @ApiProperty({ description: 'Remaining cooldown time in milliseconds' })
  remainingTime: number;

  @ApiProperty({ description: 'Last request information', required: false })
  @IsOptional()
  lastRequest?: {
    id: string;
    source: string;
    status: string;
    requestedAt: Date;
    completedAt?: Date;
  };
}

export class FaucetHistoryDto {
  @ApiProperty({ description: 'Request ID' })
  id: string;

  @ApiProperty({ description: 'Chain identifier' })
  chain: string;

  @ApiProperty({ description: 'Token symbol' })
  token: string;

  @ApiProperty({ description: 'Requested amount' })
  amount: string;

  @ApiProperty({ description: 'Request status' })
  status: string;

  @ApiProperty({ description: 'Faucet source' })
  source: string;

  @ApiProperty({ description: 'Transaction hash', required: false })
  txHash?: string;

  @ApiProperty({ description: 'Request timestamp' })
  requestedAt: Date;

  @ApiProperty({ description: 'Completion timestamp', required: false })
  completedAt?: Date;

  @ApiProperty({ description: 'Cooldown until timestamp', required: false })
  cooldownUntil?: Date;
}