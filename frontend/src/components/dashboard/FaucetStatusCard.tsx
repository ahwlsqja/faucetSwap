'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ClockIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface FaucetStatusCardProps {
  status: any;
  chainConfig: any;
  userId: string;
  onRequestComplete: () => void;
}

export function FaucetStatusCard({ 
  status, 
  chainConfig, 
  userId, 
  onRequestComplete 
}: FaucetStatusCardProps) {
  const api = useApi();
  const [cooldownTime, setCooldownTime] = useState('');

  const requestFaucetMutation = useMutation({
    mutationFn: async () => {
      if (!status.wallet) {
        // Add wallet first
        await api.addWallet(userId, {
          chain: status.chain,
          address: status.wallet || '0x', // This should be the user's address
        });
      }
      
      return api.requestFaucet({
        userId,
        chain: status.chain,
        address: status.wallet,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Faucet request successful! Received ${data.amount} ${status.symbol}`);
      } else {
        toast.error(`Faucet request failed: ${data.error}`);
      }
      onRequestComplete();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Faucet request failed');
    },
  });

  // Update cooldown display
  React.useEffect(() => {
    if (status.cooldown?.isOnCooldown && status.cooldown?.cooldownUntil) {
      const updateCooldown = () => {
        const cooldownDate = new Date(status.cooldown.cooldownUntil);
        const now = new Date();
        
        if (now >= cooldownDate) {
          setCooldownTime('Ready!');
          onRequestComplete(); // Refetch to update status
        } else {
          setCooldownTime(formatDistanceToNow(cooldownDate, { addSuffix: true }));
        }
      };

      updateCooldown();
      const interval = setInterval(updateCooldown, 1000);
      return () => clearInterval(interval);
    } else {
      setCooldownTime('');
    }
  }, [status.cooldown, onRequestComplete]);

  const getStatusColor = () => {
    if (!status.wallet) return 'border-gray-300';
    if (status.canRequest) return 'border-green-300';
    if (status.cooldown?.isOnCooldown) return 'border-yellow-300';
    return 'border-gray-300';
  };

  const getStatusIcon = () => {
    if (!status.wallet) return ExclamationCircleIcon;
    if (status.canRequest) return CheckCircleIcon;
    if (status.cooldown?.isOnCooldown) return ClockIcon;
    return CurrencyDollarIcon;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`card p-4 border-2 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: chainConfig?.color || '#6B7280' }}
          />
          <h3 className="font-semibold text-gray-900">{status.name}</h3>
        </div>
        <StatusIcon className={clsx(
          'h-5 w-5',
          status.canRequest ? 'text-green-500' : 
          status.cooldown?.isOnCooldown ? 'text-yellow-500' : 
          'text-gray-400'
        )} />
      </div>

      {/* Balance */}
      {status.balance && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">Balance</p>
          <p className="text-lg font-semibold text-gray-900">
            {parseFloat(status.balance.balanceFormatted).toFixed(4)} {status.symbol}
          </p>
        </div>
      )}

      {/* Status */}
      <div className="mb-4">
        {!status.wallet ? (
          <p className="text-sm text-orange-600">Wallet not configured</p>
        ) : status.canRequest ? (
          <p className="text-sm text-green-600">✓ Ready to request</p>
        ) : status.cooldown?.isOnCooldown ? (
          <div>
            <p className="text-sm text-yellow-600">On cooldown</p>
            <p className="text-xs text-gray-500">{cooldownTime}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Not available</p>
        )}
      </div>

      {/* Last Request */}
      {status.lastRequest && (
        <div className="mb-4 text-xs text-gray-500">
          <p>Last request: {formatDistanceToNow(new Date(status.lastRequest.completedAt), { addSuffix: true })}</p>
          <p>Amount: {status.lastRequest.amount} {status.symbol}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => requestFaucetMutation.mutate()}
          disabled={!status.canRequest || requestFaucetMutation.isPending}
          className={clsx(
            'w-full btn text-sm py-2',
            status.canRequest && !requestFaucetMutation.isPending
              ? 'btn-primary'
              : 'btn-secondary opacity-50 cursor-not-allowed'
          )}
        >
          {requestFaucetMutation.isPending ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Requesting...</span>
            </div>
          ) : (
            'Request Tokens'
          )}
        </button>

        {chainConfig?.faucetUrl && (
          <a
            href={chainConfig.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full btn btn-secondary text-sm py-2 flex items-center justify-center space-x-1"
          >
            <LinkIcon className="h-4 w-4" />
            <span>Official Faucet</span>
          </a>
        )}
      </div>
    </div>
  );
}