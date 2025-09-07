import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChainRegistryService {
  private readonly logger = new Logger(ChainRegistryService.name);

  constructor() {
    this.logger.log('🔧 ChainRegistryService initialized (stateless mode)');
  }

  // 런타임에 새로운 체인 추가 (미래 기능)
  async addNewChain(chainConfig: {
    chainId: string;
    chainType: string;
    name: string; 
    symbol: string;
    rpcUrl: string;
  }) {
    this.logger.log(`🆕 Adding new chain: ${chainConfig.chainId}`);
    
    // 실제로는 환경변수나 데이터베이스에 저장해야 함
    // 현재는 정적 설정만 지원
    throw new Error('Dynamic chain addition not implemented - use environment variables');
  }

  // 체인 제거 (미래 기능)
  async removeChain(chainId: string) {
    this.logger.log(`🗑️ Removing chain: ${chainId}`);
    throw new Error('Dynamic chain removal not implemented - use environment variables');
  }
}