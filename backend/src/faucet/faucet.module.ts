import { Module } from '@nestjs/common';
import { FaucetController } from './faucet.controller';
import { FaucetService } from './faucet.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChainsModule } from '../chains/chains.module';

@Module({
  imports: [ChainsModule],
  controllers: [FaucetController],
  providers: [FaucetService, PrismaService],
  exports: [FaucetService],
})
export class FaucetModule {}