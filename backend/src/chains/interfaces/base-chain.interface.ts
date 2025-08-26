export interface FaucetResponse {
  success: boolean;
  txHash?: string;
  amount?: string;
  error?: string;
  cooldownUntil?: Date;
}

export interface FaucetCooldown {
  isOnCooldown: boolean;
  cooldownUntil?: Date;
  remainingTimeMs?: number;
}

export interface ChainBalance {
  address: string;
  balance: string; // in wei/smallest unit
  balanceFormatted: string; // human readable
  symbol: string;
}

export abstract class BaseChainAdapter {
  abstract readonly chainId: string;
  abstract readonly name: string;
  abstract readonly symbol: string;
  abstract readonly rpcUrl: string;

  abstract getBalance(address: string): Promise<ChainBalance>;
  abstract requestFaucet(address: string): Promise<FaucetResponse>;
  abstract getCooldownInfo(userId: string): Promise<FaucetCooldown>;
  abstract isValidAddress(address: string): boolean;
}

// 새로운 모듈형 체인 인터페이스
export interface ChainModule {
  chainId: string;
  chainType: 'evm' | 'sui' | 'solana' | 'near' | 'cosmos' | 'cardano';
  name: string;
  symbol: string;
  
  // 풀 관리
  deployDonationPool(): Promise<string>;
  getDonationPoolAddress(): string;
  
  // 기부 관리
  processDonation(donor: string, amount: string, txHash: string): Promise<boolean>;
  getDonationHistory(limit?: number): Promise<DonationRecord[]>;
  
  // 분배 관리
  distributeTokens(recipient: string, amount: string, reason: string): Promise<string>;
  getAvailableBalance(): Promise<string>;
}

export interface DonationRecord {
  donor: string;
  amount: string;
  timestamp: Date;
  txHash: string;
  chain: string;
}