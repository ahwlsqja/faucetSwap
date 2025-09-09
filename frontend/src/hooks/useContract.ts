'use client';

import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi';
import { parseEther, formatEther, getAddress } from 'viem';
import { useState } from 'react';
import toast from 'react-hot-toast';

// Contract ABIs
const FAUCET_ABI = [
  // Read functions
  {
    name: 'canClaim',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getCooldownRemaining',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getContributionLevel',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'totalDonated',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getPoolStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }],
  },
  {
    name: 'faucetAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // Write functions
  {
    name: 'requestFaucet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'donate',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'message', type: 'string' }],
    outputs: [],
  },
  // Events
  {
    name: 'FaucetClaimed',
    type: 'event',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
  },
  {
    name: 'DonationReceived',
    type: 'event',
    inputs: [
      { indexed: true, name: 'donor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'message', type: 'string' },
    ],
  },
] as const;

// Contract addresses (only Ethereum Sepolia)
const CONTRACT_ADDRESSES = {
  11155111: process.env.NEXT_PUBLIC_ETHEREUM_CONTRACT || '', // Sepolia
} as const;

interface ContractInfo {
  canClaim: boolean;
  cooldownRemaining: number;
  contributionLevel: number;
  totalDonated: string;
  faucetAmount: string;
  poolStats?: {
    totalBalance: string;
    totalDistributed: string;
    totalDonations: string;
    totalUsers: string;
    totalClaims: string;
  };
}

export function useContract() {
  const { address } = useAccount();
  const chainId = useChainId();
  const walletClient = useWalletClient();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);

  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  // Get user's contract info
  const getUserContractInfo = async (userAddress?: string): Promise<ContractInfo | null> => {
    if (!publicClient || !contractAddress) return null;
    
    const targetAddress = userAddress || address;
    if (!targetAddress) return null;

    try {
      const results = await publicClient.multicall({
        contracts: [
          {
            address: contractAddress as `0x${string}`,
            abi: FAUCET_ABI,
            functionName: 'canClaim',
            args: [getAddress(targetAddress)],
          },
          {
            address: contractAddress as `0x${string}`,
            abi: FAUCET_ABI,
            functionName: 'getCooldownRemaining',
            args: [getAddress(targetAddress)],
          },
          {
            address: contractAddress as `0x${string}`,
            abi: FAUCET_ABI,
            functionName: 'getContributionLevel',
            args: [getAddress(targetAddress)],
          },
          {
            address: contractAddress as `0x${string}`,
            abi: FAUCET_ABI,
            functionName: 'totalDonated',
            args: [getAddress(targetAddress)],
          },
          {
            address: contractAddress as `0x${string}`,
            abi: FAUCET_ABI,
            functionName: 'faucetAmount',
          },
        ],
      });

      return {
        canClaim: results[0].result as boolean,
        cooldownRemaining: Number(results[1].result || 0),
        contributionLevel: Number(results[2].result || 0),
        totalDonated: formatEther(results[3].result as bigint || BigInt(0)),
        faucetAmount: formatEther(results[4].result as bigint || BigInt(0)),
      };
    } catch (error) {
      console.error('Failed to get contract info:', error);
      return null;
    }
  };

  // Get pool statistics
  const getPoolStats = async () => {
    if (!publicClient || !contractAddress) return null;

    try {
      const result = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: FAUCET_ABI,
        functionName: 'getPoolStats',
      }) as bigint[];

      return {
        totalBalance: formatEther(result[0] || BigInt(0)),
        totalDistributed: formatEther(result[1] || BigInt(0)),
        totalDonations: formatEther(result[2] || BigInt(0)),
        totalUsers: result[3]?.toString() || '0',
        totalClaims: result[4]?.toString() || '0',
      };
    } catch (error) {
      console.error('Failed to get pool stats:', error);
      return null;
    }
  };

  // Request faucet tokens
  const requestFaucet = async () => {
    if (!walletClient.data || !address || !contractAddress) {
      toast.error('Wallet not connected');
      return null;
    }

    setLoading(true);
    try {
      // Check if user can claim first
      const info = await getUserContractInfo();
      if (!info?.canClaim) {
        const hours = Math.ceil(info?.cooldownRemaining || 0 / 3600);
        toast.error(`Cooldown active. Wait ${hours} hours.`);
        setLoading(false);
        return null;
      }

      const hash = await walletClient.data.writeContract({
        address: contractAddress as `0x${string}`,
        abi: FAUCET_ABI,
        functionName: 'requestFaucet',
      });

      toast.success('Faucet request submitted!');
      return hash;
    } catch (error: any) {
      console.error('Faucet request failed:', error);
      toast.error(error.shortMessage || 'Faucet request failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Donate to faucet pool
  const donate = async (amount: string, message = '') => {
    if (!walletClient.data || !address || !contractAddress) {
      toast.error('Wallet not connected');
      return null;
    }

    setLoading(true);
    try {
      const value = parseEther(amount);
      const hash = await walletClient.data.writeContract({
        address: contractAddress as `0x${string}`,
        abi: FAUCET_ABI,
        functionName: 'donate',
        args: [message],
        value,
      });

      toast.success('Donation submitted!');
      return hash;
    } catch (error: any) {
      console.error('Donation failed:', error);
      toast.error(error.shortMessage || 'Donation failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Wait for transaction confirmation
  const waitForTransaction = async (hash: `0x${string}`) => {
    if (!publicClient) return null;

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt;
    } catch (error) {
      console.error('Failed to wait for transaction:', error);
      return null;
    }
  };

  return {
    // Contract state
    contractAddress,
    isContractAvailable: !!contractAddress && !!publicClient,
    loading,
    
    // Read functions
    getUserContractInfo,
    getPoolStats,
    
    // Write functions
    requestFaucet,
    donate,
    
    // Utils
    waitForTransaction,
  };
}