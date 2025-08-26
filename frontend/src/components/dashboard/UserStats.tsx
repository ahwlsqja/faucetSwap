'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { CurrencyDollarIcon, GiftIcon, TrophyIcon, ClockIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface UserStatsProps {
  address: string;
}

export function UserStats({ address }: UserStatsProps) {
  const api = useApi();

  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: () => api.getUserByAddress(address),
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => api.getUserStats(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-center h-16">
              <LoadingSpinner />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: CurrencyDollarIcon,
      label: 'Total Requests',
      value: stats.totalRequests.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: ClockIcon,
      label: 'Success Rate',
      value: `${Math.round(stats.successRate)}%`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: GiftIcon,
      label: 'Total Donated',
      value: `${parseFloat(stats.totalDonated).toFixed(4)} ETH`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: TrophyIcon,
      label: 'Badges Earned',
      value: '2', // This would come from badges query
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div key={item.label} className="card p-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${item.bgColor} mr-4`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-lg font-semibold text-gray-900">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}