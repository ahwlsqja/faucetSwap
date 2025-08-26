'use client';

import Link from 'next/link';
import { CurrencyDollarIcon, GiftIcon, ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface QuickActionsProps {
  address: string;
}

export function QuickActions({ address }: QuickActionsProps) {
  const actions = [
    {
      title: 'Request Tokens',
      description: 'Get testnet tokens from available faucets',
      href: '/faucet',
      icon: CurrencyDollarIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Donate Tokens',
      description: 'Contribute to community pools',
      href: '/donation',
      icon: GiftIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'View Leaderboard',
      description: 'See top contributors',
      href: '/leaderboard',
      icon: TrophyIcon,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      title: 'Platform Stats',
      description: 'Explore usage statistics',
      href: '/stats',
      icon: ChartBarIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="text-center">
            <div className={`inline-flex p-3 rounded-lg ${action.color} group-hover:scale-105 transition-transform mb-3`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {action.title}
            </h3>
            <p className="text-xs text-gray-600">
              {action.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}