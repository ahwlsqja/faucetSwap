'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { supportedChains } from '@/config/wagmi';
import { FaucetStatusCard } from './FaucetStatusCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface FaucetStatusGridProps {
  address: string;
}

export function FaucetStatusGrid({ address }: FaucetStatusGridProps) {
  const api = useApi();

  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: () => api.getUserByAddress(address),
  });

  const { data: statuses, isLoading, refetch } = useQuery({
    queryKey: ['faucet-status', user?.id],
    queryFn: () => api.getFaucetStatus(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {supportedChains.map((chain) => (
          <div key={chain.id} className="card p-6">
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!statuses) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load faucet status</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statuses.map((status: any) => {
        const chainConfig = supportedChains.find(c => c.id === status.chain);
        return (
          <FaucetStatusCard
            key={status.chain}
            status={status}
            chainConfig={chainConfig}
            userId={user!.id}
            onRequestComplete={() => refetch()}
          />
        );
      })}
    </div>
  );
}