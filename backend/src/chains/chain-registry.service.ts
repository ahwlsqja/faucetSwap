import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainManager } from './chain-manager.service';
import { EVMChainModule } from './modules/evm-chain.module';
import { SuiChainModule } from './modules/sui-chain.module';

@Injectable()
export class ChainRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ChainRegistryService.name);

  constructor(
    private chainManager: ChainManager,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.registerAllChains();
  }

  private async registerAllChains() {
    this.logger.log('🔧 Registering chain modules...');

    try {
      // EVM 체인들 등록
      await this.registerEVMChains();
      
      // Non-EVM 체인들 등록
      await this.registerNonEVMChains();
      
      this.logger.log('✅ All chain modules registered successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to register chains:', error);
    }
  }

  private async registerEVMChains() {
    const evmChains = [
      {
        chainId: 'ethereum',
        name: 'Ethereum Sepolia',
        symbol: 'ETH',
        rpcUrl: this.configService.get('ETHEREUM_RPC_URL'),
        poolAddress: this.configService.get('ETHEREUM_POOL_ADDRESS'),
      },
      {
        chainId: 'polygon', 
        name: 'Polygon Mumbai',
        symbol: 'MATIC',
        rpcUrl: this.configService.get('POLYGON_RPC_URL'),
        poolAddress: this.configService.get('POLYGON_POOL_ADDRESS'),
      },
      {
        chainId: 'bsc',
        name: 'BSC Testnet', 
        symbol: 'BNB',
        rpcUrl: this.configService.get('BSC_RPC_URL'),
        poolAddress: this.configService.get('BSC_POOL_ADDRESS'),
      },
      {
        chainId: 'arbitrum',
        name: 'Arbitrum Sepolia',
        symbol: 'ETH', 
        rpcUrl: this.configService.get('ARBITRUM_RPC_URL'),
        poolAddress: this.configService.get('ARBITRUM_POOL_ADDRESS'),
      }
    ];

    const privateKey = this.configService.get('PRIVATE_KEY');
    
    for (const chain of evmChains) {
      if (!chain.rpcUrl) {
        this.logger.warn(`⚠️ Missing RPC URL for ${chain.chainId}, skipping...`);
        continue;
      }

      const module = new EVMChainModule(
        chain.chainId,
        chain.name,
        chain.symbol,
        chain.rpcUrl,
        privateKey,
        chain.poolAddress,
      );

      this.chainManager.registerChain(chain.chainId, module);
      
      // 풀이 없다면 배포
      if (!chain.poolAddress) {
        this.logger.log(`📦 Deploying pool for ${chain.chainId}...`);
        try {
          await module.deployDonationPool();
        } catch (error) {
          this.logger.error(`Failed to deploy pool for ${chain.chainId}:`, error);
        }
      }
    }
  }

  private async registerNonEVMChains() {
    // Sui 체인 등록
    const suiRpcUrl = this.configService.get('SUI_RPC_URL');
    const suiPrivateKey = this.configService.get('SUI_PRIVATE_KEY');
    
    if (suiRpcUrl && suiPrivateKey) {
      const suiModule = new SuiChainModule(suiRpcUrl, suiPrivateKey);
      this.chainManager.registerChain('sui', suiModule);
      
      // Sui 풀 배포 (필요시)
      try {
        await suiModule.deployDonationPool();
      } catch (error) {
        this.logger.error('Failed to deploy Sui pool:', error);
      }
    }

    // 향후 다른 체인들...
    // Solana, Near, Cosmos 등을 여기에 추가
  }

  // 런타임에 새로운 체인 추가
  async addNewChain(chainConfig: {
    chainId: string;
    chainType: string;
    name: string; 
    symbol: string;
    rpcUrl: string;
    privateKey: string;
  }) {
    this.logger.log(`🆕 Adding new chain: ${chainConfig.chainId}`);

    try {
      let module;
      
      switch (chainConfig.chainType) {
        case 'evm':
          module = new EVMChainModule(
            chainConfig.chainId,
            chainConfig.name,
            chainConfig.symbol,
            chainConfig.rpcUrl,
            chainConfig.privateKey,
          );
          break;
          
        case 'sui':
          module = new SuiChainModule(
            chainConfig.rpcUrl,
            chainConfig.privateKey,
          );
          break;
          
        // case 'solana':
        //   module = new SolanaChainModule(...);
        //   break;
          
        default:
          throw new Error(`Unsupported chain type: ${chainConfig.chainType}`);
      }

      // 모듈 등록
      this.chainManager.registerChain(chainConfig.chainId, module);
      
      // 풀 배포
      await this.chainManager.initializeNewChain(chainConfig.chainId, chainConfig);
      
      this.logger.log(`✅ Successfully added ${chainConfig.chainId}`);
      
      return {
        success: true,
        chainId: chainConfig.chainId,
        poolAddress: module.getDonationPoolAddress(),
      };
      
    } catch (error) {
      this.logger.error(`❌ Failed to add ${chainConfig.chainId}:`, error);
      throw error;
    }
  }

  // 체인 제거
  async removeChain(chainId: string) {
    this.logger.log(`🗑️ Removing chain: ${chainId}`);
    this.chainManager.unregisterChain(chainId);
  }
}