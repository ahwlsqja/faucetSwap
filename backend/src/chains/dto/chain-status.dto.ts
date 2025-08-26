import { ApiProperty } from '@nestjs/swagger';

export class ChainStatusDto {
  @ApiProperty({ description: 'Chain identifier' })
  chainId: string;

  @ApiProperty({ description: 'Chain type', enum: ['evm', 'sui', 'solana', 'near'] })
  chainType: string;

  @ApiProperty({ description: 'Display name' })
  name: string;

  @ApiProperty({ description: 'Native token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Available balance in pool' })
  availableBalance: string;

  @ApiProperty({ description: 'Pool contract/program address' })
  poolAddress: string;

  @ApiProperty({ description: 'Whether the chain is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Last health check timestamp' })
  lastChecked?: Date;

  @ApiProperty({ description: 'Error message if unhealthy' })
  error?: string;
}

export class ChainStatsDto {
  @ApiProperty({ description: 'Total donations received' })
  totalDonations: number;

  @ApiProperty({ description: 'Total amount received' })
  totalAmount: string;

  @ApiProperty({ description: 'Total distributed' })
  totalDistributed: string;

  @ApiProperty({ description: 'Available balance' })
  availableBalance: string;

  @ApiProperty({ description: 'Number of active donors' })
  donorCount: number;
}

export class AllChainsStatusDto {
  @ApiProperty({ type: [ChainStatusDto] })
  chains: ChainStatusDto[];

  @ApiProperty({ description: 'Total number of supported chains' })
  totalChains: number;

  @ApiProperty({ description: 'Number of active chains' })
  activeChains: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}