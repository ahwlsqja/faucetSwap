'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { supportedChains } from '@/config/wagmi';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GiftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface DonationFormProps {
  address: string;
}

export function DonationForm({ address }: DonationFormProps) {
  const api = useApi();
  const [selectedChain, setSelectedChain] = useState(supportedChains[0]);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: () => api.getUserByAddress(address),
  });

  const { data: txHash, sendTransaction, isPending: isSending } = useSendTransaction();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess: (receipt) => {
      handleTransactionConfirmed(receipt);
    },
  });

  const createDonationMutation = useMutation({
    mutationFn: api.createDonation,
    onSuccess: () => {
      setAmount('');
      setIsSubmitting(false);
      toast.success('Donation recorded! Processing confirmation...');
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || 'Failed to record donation');
    },
  });

  const handleTransactionConfirmed = async (receipt: any) => {
    if (!user) return;

    try {
      await createDonationMutation.mutateAsync({
        userId: user.id,
        chain: selectedChain.id,
        token: selectedChain.symbol,
        amount: parseEther(amount).toString(),
        txHash: receipt.transactionHash,
      });
    } catch (error) {
      console.error('Error recording donation:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!user) {
      toast.error('User not found');
      return;
    }

    setIsSubmitting(true);

    try {
      // For demo purposes, we'll use a mock contract address
      // In production, this would be the actual donation contract
      const MOCK_DONATION_ADDRESS = '0x0000000000000000000000000000000000000001';

      await sendTransaction({
        to: MOCK_DONATION_ADDRESS as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (error: any) {
      setIsSubmitting(false);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Transaction failed');
      }
    }
  };

  const isLoading = isSending || isConfirming || isSubmitting;

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-6">
        <GiftIcon className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Make a Donation</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chain Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Chain
          </label>
          <div className="grid grid-cols-2 gap-3">
            {supportedChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => setSelectedChain(chain)}
                className={clsx(
                  'p-3 rounded-lg border-2 transition-colors text-left',
                  selectedChain.id === chain.id
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: chain.color }}
                  />
                  <div>
                    <div className="font-medium text-sm">{chain.name}</div>
                    <div className="text-xs text-gray-500">{chain.symbol}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount ({selectedChain.symbol})
          </label>
          <div className="relative">
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              step="0.0001"
              min="0"
              className="input pr-16"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <span className="text-gray-500 text-sm">{selectedChain.symbol}</span>
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Amounts
          </label>
          <div className="flex flex-wrap gap-2">
            {['0.1', '0.5', '1.0', '5.0'].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                {quickAmount} {selectedChain.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-purple-900 mb-1">
                Earn NFT Badges
              </h4>
              <div className="text-xs text-purple-700 space-y-1">
                <div>🥉 Bronze Badge: 0.1+ ETH equivalent</div>
                <div>🥈 Silver Badge: 1+ ETH equivalent</div>
                <div>🥇 Gold Badge: 5+ ETH equivalent</div>
                <div>💎 Diamond Badge: 10+ ETH equivalent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          className={clsx(
            'w-full btn py-3 text-sm font-medium',
            !amount || parseFloat(amount) <= 0 || isLoading
              ? 'btn-secondary opacity-50 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>
                {isSending ? 'Sending...' : 
                 isConfirming ? 'Confirming...' : 
                 'Processing...'}
              </span>
            </div>
          ) : (
            `Donate ${amount || '0'} ${selectedChain.symbol}`
          )}
        </button>
      </form>

      {/* Transaction Status */}
      {txHash && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Transaction sent! 
            <a
              href={`${selectedChain.blockExplorer}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline hover:no-underline"
            >
              View on explorer →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}