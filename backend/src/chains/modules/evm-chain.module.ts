import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ChainModule, DonationRecord } from '../interfaces/base-chain.interface';

@Injectable()
export class EVMChainModule implements ChainModule {
  private readonly logger = new Logger(`EVMChain-${this.chainId}`);
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  readonly chainType = 'evm' as const;
  
  constructor(
    public readonly chainId: string,
    public readonly name: string, 
    public readonly symbol: string,
    private readonly rpcUrl: string,
    private readonly privateKey: string,
    private readonly donationPoolAddress?: string,
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    if (donationPoolAddress) {
      this.contract = new ethers.Contract(
        donationPoolAddress,
        DONATION_POOL_ABI, // ABI는 아래 정의
        this.wallet
      );
    }
  }

  async deployDonationPool(): Promise<string> {
    try {
      this.logger.log(`🚀 Deploying donation pool on ${this.chainId}...`);
      
      const factory = new ethers.ContractFactory(
        DONATION_POOL_ABI,
        DONATION_POOL_BYTECODE,
        this.wallet
      );
      
      const contract = await factory.deploy();
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      this.contract = contract;
      
      this.logger.log(`✅ Pool deployed at ${address} on ${this.chainId}`);
      return address;
      
    } catch (error) {
      this.logger.error(`❌ Deployment failed on ${this.chainId}:`, error);
      throw error;
    }
  }

  getDonationPoolAddress(): string {
    return this.contract?.target as string || '';
  }

  async processDonation(donor: string, amount: string, txHash: string): Promise<boolean> {
    try {
      // 트랜잭션 확인
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or not found');
      }

      // 컨트랙트로 전송된 트랜잭션인지 확인
      if (tx.to?.toLowerCase() !== this.contract.target.toString().toLowerCase()) {
        throw new Error('Transaction not sent to donation pool');
      }

      this.logger.log(`✅ Donation processed: ${amount} ${this.symbol} from ${donor}`);
      return true;
      
    } catch (error) {
      this.logger.error(`❌ Failed to process donation:`, error);
      return false;
    }
  }

  async getDonationHistory(limit = 50): Promise<DonationRecord[]> {
    try {
      if (!this.contract) return [];

      // 컨트랙트 이벤트 조회
      const filter = this.contract.filters.DonationReceived();
      const events = await this.contract.queryFilter(filter, -10000); // 최근 10000 블록

      const donations = await Promise.all(
        events.slice(-limit).map(async (event) => {
          const block = await event.getBlock();
          return {
            donor: event.args[0],
            amount: ethers.formatEther(event.args[1]),
            timestamp: new Date(block.timestamp * 1000),
            txHash: event.transactionHash,
            chain: this.chainId,
          };
        })
      );

      return donations.reverse(); // 최신순 정렬
      
    } catch (error) {
      this.logger.error(`Failed to get donation history:`, error);
      return [];
    }
  }

  // 읽기 전용: 분배는 컨트랙트에서 자동 처리
  async distributeTokens(recipient: string, amount: string, reason: string): Promise<string> {
    throw new Error('Distribution is handled by smart contract directly');
  }

  async getAvailableBalance(): Promise<string> {
    try {
      if (!this.contract) return '0';
      
      const balance = await this.contract.getAvailableBalance();
      return ethers.formatEther(balance);
      
    } catch (error) {
      this.logger.error(`Failed to get balance:`, error);
      return '0';
    }
  }

  // 🕒 쿨다운 조회 헬퍼 함수들
  async getCooldownInfo(userAddress: string): Promise<{
    canClaim: boolean;
    remainingTime: number; // milliseconds  
    nextClaimTime?: Date;
  }> {
    try {
      if (!this.contract) {
        return { canClaim: false, remainingTime: 86400000 };
      }

      // 스마트 컨트랙트에서 쿨다운 확인
      const remainingSeconds = await this.contract.getCooldownRemaining(userAddress);
      const remainingMs = parseInt(remainingSeconds.toString()) * 1000;
      const canClaim = remainingMs === 0;

      return {
        canClaim,
        remainingTime: remainingMs,
        nextClaimTime: canClaim ? undefined : new Date(Date.now() + remainingMs),
      };

    } catch (error) {
      this.logger.error('Failed to get cooldown info:', error);
      return { canClaim: false, remainingTime: 86400000 };
    }
  }

  // 🏆 기여도 레벨 조회
  async getContributionLevel(userAddress: string): Promise<{
    level: number;
    levelName: string; 
    totalDonated: string;
    nextLevelRequirement?: string;
  }> {
    try {
      if (!this.contract) {
        return { level: 0, levelName: 'None', totalDonated: '0', nextLevelRequirement: '0.1' };
      }

      // 스마트 컨트랙트에서 기여도 레벨 확인
      const level = await this.contract.getContributionLevel(userAddress);
      const totalDonatedWei = await this.contract.totalDonated(userAddress);
      const totalDonated = ethers.formatEther(totalDonatedWei);

      const levels = [
        { level: 0, name: 'None', min: 0, next: 0.1 },
        { level: 1, name: 'Bronze', min: 0.1, next: 1.0 },
        { level: 2, name: 'Silver', min: 1.0, next: 5.0 },
        { level: 3, name: 'Gold', min: 5.0, next: 10.0 },
        { level: 4, name: 'Diamond', min: 10.0, next: null },
      ];

      const currentLevel = levels[level];

      return {
        level: parseInt(level.toString()),
        levelName: currentLevel.name,
        totalDonated,
        nextLevelRequirement: currentLevel.next?.toString(),
      };

    } catch (error) {
      this.logger.error('Failed to get contribution level:', error);
      return {
        level: 0,
        levelName: 'None',
        totalDonated: '0',
        nextLevelRequirement: '0.1'
      };
    }
  }

  // 📊 풀 통계 조회
  async getPoolStatistics(): Promise<{
    currentBalance: string;
    totalDonations: string;
    totalClaimed: string;
    faucetAmount: string;
    availableClaims: number;
  }> {
    try {
      if (!this.contract) {
        return {
          currentBalance: '0',
          totalDonations: '0', 
          totalClaimed: '0',
          faucetAmount: '0.1',
          availableClaims: 0,
        };
      }

      // 스마트 컨트랙트에서 통계 조회
      const stats = await this.contract.getPoolStats();
      const currentBalance = ethers.formatEther(stats[0]);
      const totalDonations = ethers.formatEther(stats[1]);
      const totalClaimed = ethers.formatEther(stats[2]);
      const faucetAmount = ethers.formatEther(stats[5] || await this.contract.faucetAmount());

      return {
        currentBalance,
        totalDonations,
        totalClaimed,
        faucetAmount,
        availableClaims: Math.floor(parseFloat(currentBalance) / parseFloat(faucetAmount)),
      };

    } catch (error) {
      this.logger.error('Failed to get pool statistics:', error);
      return {
        currentBalance: '0',
        totalDonations: '0',
        totalClaimed: '0', 
        faucetAmount: '0.1',
        availableClaims: 0,
      };
    }
  }
}

// 간단한 ABI (실제로는 전체 ABI 사용)
const DONATION_POOL_ABI = [
  "function donate(string calldata message) external payable",
  "function distributeTokens(address recipient, uint256 amount, string calldata reason) external",
  "function getAvailableBalance() external view returns (uint256)",
  "function getPoolStats() external view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
  "event DonationReceived(address indexed donor, uint256 amount, string message)",
  "event TokensDistributed(address indexed recipient, uint256 amount, string reason)"
];

const DONATION_POOL_BYTECODE = "0x608060405234801561001057600080fd5b50..."; // 실제 바이트코드