import { IsString, IsNotEmpty, IsEthereumAddress, IsOptional, IsPositive, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProcessDonationDto {
  @ApiProperty({ description: 'Donor wallet address' })
  @IsEthereumAddress()
  donor: string;

  @ApiProperty({ description: 'Chain identifier' })
  @IsString()
  @IsNotEmpty()
  chain: string;

  @ApiProperty({ description: 'Donation amount (in token units)' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ description: 'Transaction hash' })
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @ApiPropertyOptional({ description: 'Donation message' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class DistributeTokensDto {
  @ApiProperty({ description: 'Recipient wallet address' })
  @IsEthereumAddress()
  recipient: string;

  @ApiProperty({ description: 'Chain identifier' })
  @IsString()
  @IsNotEmpty()
  chain: string;

  @ApiProperty({ description: 'Amount to distribute' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ description: 'Reason for distribution' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class BatchDistributeDto {
  @ApiProperty({ description: 'Chain identifier' })
  @IsString()
  @IsNotEmpty()
  chain: string;

  @ApiProperty({ 
    description: 'Distribution list',
    type: [Object],
    example: [
      { recipient: '0x123...', amount: '0.1', reason: 'Faucet request' },
      { recipient: '0x456...', amount: '0.2', reason: 'Development support' }
    ]
  })
  distributions: {
    recipient: string;
    amount: string;
    reason: string;
  }[];

  @ApiPropertyOptional({ description: 'Global reason for batch' })
  @IsOptional()
  @IsString()
  batchReason?: string;
}

export class CrossChainDistributeDto {
  @ApiProperty({
    description: 'Cross-chain distribution list',
    type: [Object],
    example: [
      { chain: 'ethereum', recipient: '0x123...', amount: '0.1', reason: 'ETH needed' },
      { chain: 'sui', recipient: '0x456...', amount: '5.0', reason: 'SUI needed' }
    ]
  })
  distributions: {
    chain: string;
    recipient: string;
    amount: string;
    reason: string;
  }[];
}

export class DonationHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Chain filter' })
  @IsOptional()
  @IsString()
  chain?: string;

  @ApiPropertyOptional({ description: 'Donor address filter' })
  @IsOptional()
  @IsEthereumAddress()
  donor?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}