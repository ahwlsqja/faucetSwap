'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface UserBadgesProps {
  address: string;
}

const BADGE_CONFIG = {
  BRONZE: {
    name: 'Bronze Contributor',
    color: 'from-yellow-600 to-yellow-800',
    icon: '🥉',
    description: 'Donated 0.1+ ETH equivalent',
  },
  SILVER: {
    name: 'Silver Contributor',
    color: 'from-gray-400 to-gray-600',
    icon: '🥈',
    description: 'Donated 1+ ETH equivalent',
  },
  GOLD: {
    name: 'Gold Contributor',
    color: 'from-yellow-400 to-yellow-600',
    icon: '🥇',
    description: 'Donated 5+ ETH equivalent',
  },
  DIAMOND: {
    name: 'Diamond Contributor',
    color: 'from-cyan-400 to-blue-600',
    icon: '💎',
    description: 'Donated 10+ ETH equivalent',
  },
};

export function UserBadges({ address }: UserBadgesProps) {
  const api = useApi();

  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: () => api.getUserByAddress(address),
  });

  const { data: badges, isLoading } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: () => api.getUserBadges(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <div className="card p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="text-center">
          <SparklesIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Earn Your First Badge!
          </h3>
          <p className="text-purple-700 mb-4">
            Start contributing to the community by donating your unused testnet tokens.
            Earn exclusive NFT badges based on your contribution level!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(BADGE_CONFIG).map(([level, config]) => (
              <div key={level} className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-2xl mb-1">{config.icon}</div>
                <div className="text-xs font-medium text-purple-800">{config.name}</div>
                <div className="text-xs text-purple-600 mt-1">{config.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sort badges by level (highest first)
  const sortedBadges = badges.sort((a: any, b: any) => {
    const levelOrder = { DIAMOND: 4, GOLD: 3, SILVER: 2, BRONZE: 1 };
    return levelOrder[b.badgeLevel as keyof typeof levelOrder] - levelOrder[a.badgeLevel as keyof typeof levelOrder];
  });

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrophyIcon className="h-6 w-6 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900">Your NFT Badges</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sortedBadges.map((badge: any) => {
          const config = BADGE_CONFIG[badge.badgeLevel as keyof typeof BADGE_CONFIG];
          
          return (
            <div key={badge.id} className="relative group">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${config.color} text-white text-center transform transition-transform group-hover:scale-105`}>
                <div className="text-3xl mb-2">{config.icon}</div>
                <h4 className="font-semibold text-sm mb-1">{config.name}</h4>
                <p className="text-xs opacity-90">
                  Total: {parseFloat(badge.totalDonated).toFixed(4)} ETH
                </p>
                {badge.tokenId && (
                  <p className="text-xs opacity-75 mt-1">
                    Token #{badge.tokenId}
                  </p>
                )}
              </div>
              
              {/* Glow effect for highest badge */}
              {badge === sortedBadges[0] && (
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.color} opacity-20 blur-lg -z-10 animate-pulse`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Total Contribution:</strong> {
            badges.reduce((total: number, badge: any) => {
              return Math.max(total, parseFloat(badge.totalDonated));
            }, 0).toFixed(4)
          } ETH equivalent
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Keep donating to unlock higher tier badges and earn more exclusive NFTs!
        </p>
      </div>
    </div>
  );
}