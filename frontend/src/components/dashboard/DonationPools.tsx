'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { supportedChains } from '@/config/wagmi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GiftIcon, UsersIcon } from '@heroicons/react/24/outline';

export function DonationPools() {
  const api = useApi();

  const { data: pools, isLoading } = useQuery({
    queryKey: ['donation-pools'],
    queryFn: api.getDonationPools,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-center h-20">
              <LoadingSpinner />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!pools || pools.length === 0) {
    return (
      <div className="text-center py-8">
        <GiftIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No donation pools available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pools.map((pool: any) => {
        const chainConfig = supportedChains.find(c => c.id === pool.chain);
        const availableAmount = parseFloat(pool.available);
        const totalAmount = parseFloat(pool.totalAmount);
        const utilization = totalAmount > 0 ? ((totalAmount - availableAmount) / totalAmount) * 100 : 0;

        return (
          <div key={pool.chain} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: chainConfig?.color || '#6B7280' }}
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {chainConfig?.name || pool.chain}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {availableAmount.toFixed(4)} {pool.token} available
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {utilization.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">utilized</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Total: {totalAmount.toFixed(4)} {pool.token}</span>
              <span>Distributed: {parseFloat(pool.distributed).toFixed(4)} {pool.token}</span>
            </div>
          </div>
        );
      })}

      {/* Community Impact Summary */}
      <div className="card p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <UsersIcon className="h-5 w-5 text-purple-600" />
          <h4 className="font-medium text-purple-900">Community Impact</h4>
        </div>
        <p className="text-sm text-purple-700">
          {pools.length} active donation pools supporting developers across multiple testnets.
          Join the community by contributing your unused testnet tokens!
        </p>
      </div>
    </div>
  );
}