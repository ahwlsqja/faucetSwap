import { ApiProperty } from '@nestjs/swagger';

export class CooldownInfoDto {
  @ApiProperty({ description: '현재 클레임 가능 여부' })
  canClaim: boolean;

  @ApiProperty({ description: '남은 쿨다운 시간 (밀리초)' })
  remainingTime: number;

  @ApiProperty({ description: '다음 클레임 가능 시각', required: false })
  nextClaimTime?: Date;
}

export class ContributionLevelDto {
  @ApiProperty({ description: '기여도 레벨 (0-4)' })
  level: number;

  @ApiProperty({ description: '레벨 이름' })
  levelName: string;

  @ApiProperty({ description: '총 기부액' })
  totalDonated: string;

  @ApiProperty({ description: '다음 레벨까지 필요한 기부액', required: false })
  nextLevelRequirement?: string;
}

export class PoolStatisticsDto {
  @ApiProperty({ description: '현재 풀 잔액' })
  currentBalance: string;

  @ApiProperty({ description: '총 기부액' })
  totalDonations: string;

  @ApiProperty({ description: '총 클레임액' })
  totalClaimed: string;

  @ApiProperty({ description: '1회 지급액' })
  faucetAmount: string;

  @ApiProperty({ description: '가능한 클레임 횟수' })
  availableClaims: number;
}