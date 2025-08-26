import { Module } from '@nestjs/common';
import { NFTBadgeService } from './nft-badge.service';
import { NFTBadgeController } from './nft-badge.controller';
import { ChainsModule } from '../chains/chains.module';

@Module({
  imports: [ChainsModule],
  controllers: [NFTBadgeController],
  providers: [NFTBadgeService],
  exports: [NFTBadgeService],
})
export class NFTModule {}