'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TrophyIcon, CrownIcon } from '@heroicons/react/24/outline';

const BADGE_ICONS = {
  BRONZE: '🥉',
  SILVER: '🥈', 
  GOLD: '🥇',
  DIAMOND: '💎',
};

export function TopContributors() {
  const api = useApi();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', 10],
    queryFn: () => api.getLeaderboard(10),
    refetchInterval: 60000, // Refetch every minute
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

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="card p-6 text-center">
        <TrophyIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No contributors yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Be the first to make a donation!
        </p>
      </div>
    );
  }

  const formatAddress = (address: string) => {
    if (!address) return 'Anonymous';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <CrownIcon className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <span className="text-gray-400 font-bold">#2</span>;
      case 3:
        return <span className="text-yellow-600 font-bold">#3</span>;
      default:
        return <span className="text-gray-500 font-medium">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'bg-white border-gray-100';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-2">
          <TrophyIcon className="h-5 w-5 text-yellow-600" />
          <h3 className="font-medium text-gray-900">Top Contributors</h3>
        </div>
      </div>
      
      <div className="card-content p-0">
        <div className="divide-y divide-gray-100">
          {leaderboard.map((contributor: any) => (
            <div 
              key={contributor.user.id} 
              className={`p-4 ${getRankStyle(contributor.rank)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(contributor.rank)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {formatAddress(contributor.user.address)}
                      </span>
                      {contributor.highestBadge && (
                        <span className="text-lg">
                          {BADGE_ICONS[contributor.highestBadge.badgeLevel as keyof typeof BADGE_ICONS]}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {contributor.donationCount} donation{contributor.donationCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {parseFloat(contributor.totalDonated).toFixed(4)} ETH
                  </div>
                  {contributor.rank <= 3 && (
                    <div className="text-xs text-gray-500">
                      {contributor.rank === 1 ? 'Top Contributor' :
                       contributor.rank === 2 ? 'Runner-up' :
                       '3rd Place'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
        <p className="text-sm text-purple-800 text-center">
          🚀 Join our amazing contributors! Make a donation to appear on the leaderboard.
        </p>
      </div>
    </div>
  );
}