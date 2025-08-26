import { IsString, IsNotEmpty, IsUrl, IsIn, IsOptional, IsEthereumAddress } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddChainDto {
  @ApiProperty({ description: 'Chain identifier (e.g., ethereum, polygon, sui)' })
  @IsString()
  @IsNotEmpty()
  chainId: string;

  @ApiProperty({ 
    description: 'Chain type',
    enum: ['evm', 'sui', 'solana', 'near', 'cosmos', 'cardano'],
    example: 'evm'
  })
  @IsIn(['evm', 'sui', 'solana', 'near', 'cosmos', 'cardano'])
  chainType: string;

  @ApiProperty({ description: 'Display name', example: 'Ethereum Sepolia' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Native token symbol', example: 'ETH' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'RPC endpoint URL', example: 'https://sepolia.infura.io/v3/...' })
  @IsUrl()
  rpcUrl: string;

  @ApiProperty({ description: 'Private key for pool management (without 0x prefix)' })
  @IsString()
  @IsNotEmpty()
  privateKey: string;

  @ApiPropertyOptional({ description: 'Existing pool address (if already deployed)' })
  @IsOptional()
  @IsString()
  poolAddress?: string;

  @ApiPropertyOptional({ description: 'Official faucet URL' })
  @IsOptional()
  @IsUrl()
  faucetUrl?: string;

  @ApiPropertyOptional({ description: 'Block explorer base URL' })
  @IsOptional()
  @IsUrl()  
  blockExplorerUrl?: string;

  @ApiPropertyOptional({ description: 'Chain-specific configuration' })
  @IsOptional()
  config?: Record<string, any>;
}

export class RemoveChainDto {
  @ApiProperty({ description: 'Chain identifier to remove' })
  @IsString()
  @IsNotEmpty()
  chainId: string;

  @ApiPropertyOptional({ description: 'Reason for removal' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateChainDto {
  @ApiProperty({ description: 'Chain identifier' })
  @IsString()
  @IsNotEmpty()
  chainId: string;

  @ApiPropertyOptional({ description: 'New RPC URL' })
  @IsOptional()
  @IsUrl()
  rpcUrl?: string;

  @ApiPropertyOptional({ description: 'New pool address' })
  @IsOptional()
  @IsString()
  poolAddress?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Configuration updates' })
  @IsOptional()
  config?: Record<string, any>;
}