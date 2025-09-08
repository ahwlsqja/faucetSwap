import { Module } from '@nestjs/common';
import { ChainManager } from './chain-manager.service';
import { ChainRegistryService } from './chain-registry.service';
import { ChainManagerController } from './chain-manager.controller';
import { EVMChainService } from './services/evm-chain.service';
import { SuiChainService } from './services/sui-chain.service';

@Module({
  controllers: [ChainManagerController],
  providers: [
    ChainManager,
    ChainRegistryService,
    EVMChainService,
    SuiChainService,
  ],
  exports: [
    ChainManager,
    ChainRegistryService,
    EVMChainService,
    SuiChainService,
  ],
})
export class ChainsModule {}