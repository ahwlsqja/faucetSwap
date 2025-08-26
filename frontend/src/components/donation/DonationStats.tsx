'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supportedChains } from '@/config/wagmi';
import { 
  CurrencyDollarIcon,
  UsersIcon,
  GiftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export function DonationStats() {
  const api = useApi();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['donation-stats'],
    queryFn: api.getDonationStats,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-center h-16">
              <LoadingSpinner />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load donation statistics</p>
      </div>
    );
  }

  const globalStats = [
    {
      icon: GiftIcon,
      label: 'Total Donations',
      value: stats.global.totalDonations.toString(),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: CurrencyDollarIcon,
      label: 'Total Amount',
      value: `${parseFloat(stats.global.totalAmount || '0').toFixed(4)} ETH`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: UsersIcon,
      label: 'Contributors',
      value: stats.topDonors.length.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: SparklesIcon,
      label: 'Success Rate',
      value: `${Math.round((stats.global.confirmedDonations / stats.global.totalDonations) * 100)}%`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Global Stats */}
      <div className="space-y-3">
        {globalStats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chain Breakdown */}
      <div className="card p-4">
        <h4 className="font-medium text-gray-900 mb-3">By Chain</h4>
        <div className="space-y-2">
          {Object.entries(stats.byChain || {}).map(([chainId, chainStats]: [string, any]) => {
            const chainConfig = supportedChains.find(c => c.id === chainId);
            return (
              <div key={chainId} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: chainConfig?.color || '#6B7280' }}
                  />
                  <span className="text-gray-700">
                    {chainConfig?.name || chainId}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {chainStats.donations}
                  </div>
                  <div className="text-xs text-gray-500">
                    {parseFloat(chainStats.totalAmount || '0').toFixed(4)} {chainConfig?.symbol}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="card p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="text-center">
          <SparklesIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h4 className="font-medium text-purple-900 mb-1">Community Impact</h4>
          <p className="text-sm text-purple-700">
            Our community has donated across {Object.keys(stats.byChain || {}).length} chains,
            helping developers get the testnet tokens they need to build amazing dApps!
          </p>
        </div>
      </div>
    </div>
  );
}