import { Module } from '@nestjs/common';
import { ChainManager } from './chain-manager.service';
import { ChainRegistryService } from './chain-registry.service';
import { ChainManagerController } from './chain-manager.controller';
import { EVMChainModule } from './modules/evm-chain.module';
import { SuiChainModule } from './modules/sui-chain.module';

@Module({
  controllers: [ChainManagerController],
  providers: [
    ChainManager,
    ChainRegistryService,
    EVMChainModule,
    SuiChainModule,
  ],
  exports: [
    ChainManager,
    ChainRegistryService,
  ],
})
export class ChainsModule {}