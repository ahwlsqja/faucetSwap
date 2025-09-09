'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useApi } from './useApi';
import { useContract } from './useContract';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface DonationData {
  chain: string;
  amount: string;
  message?: string;
}

export function useDonation() {
  const { address } = useAccount();
  const { user, isAuthenticated } = useAuth();
  const { createDonation } = useApi();
  const { donate: donateContract, getPoolStats, waitForTransaction } = useContract();
  const [loading, setLoading] = useState(false);

  // Make a donation
  const donate = useCallback(async (donationData: DonationData) => {
    if (!address || !isAuthenticated || !user) {
      toast.error('Please connect wallet and sign in');
      return null;
    }

    setLoading(true);
    try {
      // Step 1: Call smart contract
      const txHash = await donateContract(donationData.amount, donationData.message || '');
      if (!txHash) {
        return null;
      }

      // Step 2: Wait for confirmation
      const receipt = await waitForTransaction(txHash);
      
      if (receipt?.status === 'success') {
        // Step 3: Record in backend
        try {
          await createDonation({
            userId: user.id,
            chain: donationData.chain,
            token: donationData.chain === 'ethereum' ? 'ETH' : 'BNB',
            amount: donationData.amount,
            txHash,
          });
          
          toast.success('Donation completed! Thank you for supporting the faucet.');
        } catch (backendError) {
          console.error('Failed to record donation in backend:', backendError);
          toast.success('Donation completed! (Backend recording failed)');
        }
      } else {
        toast.error('Donation transaction failed');
      }

      return { txHash, receipt };
    } catch (error: any) {
      console.error('Donation error:', error);
      toast.error(error.response?.data?.message || 'Donation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [address, isAuthenticated, user, donateContract, createDonation, waitForTransaction]);

  // Get pool statistics
  const getStats = useCallback(async () => {
    try {
      const stats = await getPoolStats();
      return stats;
    } catch (error) {
      console.error('Failed to get pool stats:', error);
      return null;
    }
  }, [getPoolStats]);

  return {
    // State
    loading,
    
    // Functions
    donate,
    getStats,
  };
}