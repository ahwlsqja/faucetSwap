'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useApi } from './useApi';
import { useContract } from './useContract';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface FaucetRequestOptions {
  chain: string;
  source: 'OFFICIAL_FAUCET' | 'COMMUNITY_POOL';
}

export function useFaucet() {
  const { address } = useAccount();
  const { isAuthenticated } = useAuth();
  const { requestFaucet: requestFaucetAPI, getCooldownStatus, updateRequestStatus } = useApi();
  const { requestFaucet: requestFaucetContract, getUserContractInfo, waitForTransaction } = useContract();
  const [loading, setLoading] = useState(false);

  // Request faucet tokens
  const requestFaucet = useCallback(async (options: FaucetRequestOptions) => {
    if (!address || !isAuthenticated) {
      toast.error('Please connect wallet and sign in');
      return null;
    }

    setLoading(true);
    try {
      // Step 1: Create request in backend
      const response = await requestFaucetAPI(options);
      
      if (options.source === 'OFFICIAL_FAUCET') {
        // Official faucet: redirect to external URL
        if (response.redirectUrl) {
          window.open(response.redirectUrl, '_blank');
          toast.success('Redirected to official faucet');
        }
        return response;
      } else {
        // Community pool: interact with smart contract
        if (!response.contractCall) {
          toast.error('Contract interaction not available');
          return null;
        }

        // Step 2: Call smart contract
        const txHash = await requestFaucetContract();
        if (!txHash) {
          return null;
        }

        // Step 3: Wait for transaction confirmation
        const receipt = await waitForTransaction(txHash);
        if (receipt?.status === 'success') {
          // Step 4: Update backend with success
          await updateRequestStatus(response.requestId, 'SUCCESS', txHash);
          toast.success('Faucet tokens received!');
        } else {
          // Update backend with failure
          await updateRequestStatus(response.requestId, 'FAILED', txHash);
          toast.error('Transaction failed');
        }

        return { ...response, txHash, receipt };
      }
    } catch (error: any) {
      console.error('Faucet request error:', error);
      toast.error(error.response?.data?.message || 'Faucet request failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [address, isAuthenticated, requestFaucetAPI, requestFaucetContract, updateRequestStatus, waitForTransaction]);

  // Check cooldown status
  const checkCooldown = useCallback(async (chain?: string) => {
    if (!address) return null;

    try {
      // Get cooldown from backend (database-based)
      const backendCooldown = await getCooldownStatus(address, chain);
      
      // If requesting from community pool, also check contract
      if (chain && ['ethereum', 'bsc'].includes(chain)) {
        const contractInfo = await getUserContractInfo();
        return {
          ...backendCooldown,
          contractInfo,
        };
      }

      return backendCooldown;
    } catch (error) {
      console.error('Failed to check cooldown:', error);
      return null;
    }
  }, [address, getCooldownStatus, getUserContractInfo]);

  return {
    // State
    loading,
    
    // Functions
    requestFaucet,
    checkCooldown,
  };
}