'use client';

import { useAccount } from 'wagmi';
import { FaucetStatusGrid } from '@/components/dashboard/FaucetStatusGrid';
import { DonationPools } from '@/components/dashboard/DonationPools';
import { UserStats } from '@/components/dashboard/UserStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { WalletConnectionPrompt } from '@/components/dashboard/WalletConnectionPrompt';

export default function Dashboard() {
  const { isConnected, address } = useAccount();

  if (!isConnected || !address) {
    return <WalletConnectionPrompt />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Testnet Faucet Dashboard
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Manage your testnet tokens and contribute to the community
        </p>
      </div>

      {/* User Stats */}
      <UserStats address={address} />

      {/* Quick Actions */}
      <QuickActions address={address} />

      {/* Faucet Status Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Faucet Status
        </h2>
        <FaucetStatusGrid address={address} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donation Pools */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Community Donation Pools
          </h2>
          <DonationPools />
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <RecentActivity address={address} />
        </div>
      </div>
    </div>
  );
}