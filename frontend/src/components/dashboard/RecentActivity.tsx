'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { supportedChains } from '@/config/wagmi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  CurrencyDollarIcon, 
  GiftIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  address: string;
}

export function RecentActivity({ address }: RecentActivityProps) {
  const api = useApi();

  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: () => api.getUserByAddress(address),
  });

  const { data: faucetHistory, isLoading: isLoadingFaucet } = useQuery({
    queryKey: ['faucet-history', user?.id],
    queryFn: () => api.getFaucetHistory(user!.id, 1, 5),
    enabled: !!user?.id,
  });

  const { data: donationHistory, isLoading: isLoadingDonations } = useQuery({
    queryKey: ['donation-history', user?.id],
    queryFn: () => api.getDonationHistory(user!.id, 1, 5),
    enabled: !!user?.id,
  });

  const isLoading = isLoadingFaucet || isLoadingDonations;

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Combine and sort activities
  const activities = [
    ...(faucetHistory?.requests || []).map((request: any) => ({
      ...request,
      type: 'faucet',
      timestamp: request.requestedAt,
    })),
    ...(donationHistory?.donations || []).map((donation: any) => ({
      ...donation,
      type: 'donation',
      timestamp: donation.donatedAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  if (activities.length === 0) {
    return (
      <div className="card p-6 text-center">
        <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No recent activity</p>
        <p className="text-sm text-gray-400 mt-2">
          Start by requesting tokens from a faucet or making a donation
        </p>
      </div>
    );
  }

  const getActivityIcon = (activity: any) => {
    if (activity.type === 'faucet') {
      if (activity.status === 'SUCCESS') return CheckCircleIcon;
      if (activity.status === 'FAILED') return XCircleIcon;
      return ClockIcon;
    }
    return GiftIcon;
  };

  const getActivityColor = (activity: any) => {
    if (activity.type === 'faucet') {
      if (activity.status === 'SUCCESS') return 'text-green-500';
      if (activity.status === 'FAILED') return 'text-red-500';
      return 'text-yellow-500';
    }
    return 'text-purple-500';
  };

  const getChainName = (chainId: string) => {
    const chain = supportedChains.find(c => c.id === chainId);
    return chain?.name || chainId;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="card-content p-0">
        <div className="divide-y divide-gray-100">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity);
            const iconColor = getActivityColor(activity);
            
            return (
              <div key={`${activity.type}-${activity.id}-${index}`} className="p-4">
                <div className="flex items-start space-x-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type === 'faucet' ? (
                          <>
                            Faucet Request
                            {activity.status === 'SUCCESS' && (
                              <span className="ml-2 text-green-600">
                                +{activity.amount} {activity.token}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            Donation
                            <span className="ml-2 text-purple-600">
                              -{activity.amount} {activity.token}
                            </span>
                          </>
                        )}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{getChainName(activity.chain)}</span>
                      {activity.type === 'faucet' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                          activity.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {activity.status.toLowerCase()}
                        </span>
                      )}
                      {activity.type === 'donation' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {activity.status.toLowerCase()}
                        </span>
                      )}
                    </div>

                    {activity.txHash && (
                      <div className="mt-1">
                        <a
                          href={`${supportedChains.find(c => c.id === activity.chain)?.blockExplorer}/tx/${activity.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View on Explorer →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}