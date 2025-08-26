'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { supportedChains } from '@/config/wagmi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface DonationHistoryProps {
  address: string;
}

export function DonationHistory({ address }: DonationHistoryProps) {
  const api = useApi();

  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: () => api.getUserByAddress(address),
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ['donation-history', user?.id],
    queryFn: () => api.getDonationHistory(user!.id, 1, 10),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!history?.donations || history.donations.length === 0) {
    return (
      <div className="card p-6 text-center">
        <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No donation history</p>
        <p className="text-sm text-gray-400 mt-2">
          Your donations will appear here once you make your first contribution
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return CheckCircleIcon;
      case 'FAILED':
        return ExclamationCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-500';
      case 'FAILED':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getChainConfig = (chainId: string) => {
    return supportedChains.find(c => c.id === chainId);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-medium text-gray-900">Recent Donations</h3>
      </div>
      
      <div className="card-content p-0">
        <div className="divide-y divide-gray-100">
          {history.donations.map((donation: any) => {
            const StatusIcon = getStatusIcon(donation.status);
            const chainConfig = getChainConfig(donation.chain);
            
            return (
              <div key={donation.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <StatusIcon className={clsx(
                      'h-5 w-5 mt-0.5 flex-shrink-0',
                      getStatusColor(donation.status)
                    )} />
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: chainConfig?.color || '#6B7280' }}
                        />
                        <span className="font-medium text-gray-900">
                          {chainConfig?.name || donation.chain}
                        </span>
                        <span className="text-purple-600 font-semibold">
                          -{parseFloat(donation.amount).toFixed(4)} {donation.token}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          {formatDistanceToNow(new Date(donation.donatedAt), { addSuffix: true })}
                        </span>
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          donation.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          donation.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        )}>
                          {donation.status.toLowerCase()}
                        </span>
                      </div>

                      {donation.txHash && (
                        <div className="mt-2">
                          <a
                            href={`${chainConfig?.blockExplorer}/tx/${donation.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <LinkIcon className="h-3 w-3" />
                            <span>View transaction</span>
                          </a>
                        </div>
                      )}

                      {donation.status === 'CONFIRMED' && donation.confirmedAt && (
                        <div className="mt-1 text-xs text-green-600">
                          Confirmed {formatDistanceToNow(new Date(donation.confirmedAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {history.pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {history.donations.length} of {history.pagination.total} donations
            </span>
            <div className="space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}