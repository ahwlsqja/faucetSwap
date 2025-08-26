'use client';

import { useAccount } from 'wagmi';
import { WalletConnectionPrompt } from '@/components/dashboard/WalletConnectionPrompt';
import { DonationForm } from '@/components/donation/DonationForm';
import { DonationStats } from '@/components/donation/DonationStats';
import { UserBadges } from '@/components/donation/UserBadges';
import { DonationHistory } from '@/components/donation/DonationHistory';
import { TopContributors } from '@/components/donation/TopContributors';

export default function DonationPage() {
  const { isConnected, address } = useAccount();

  if (!isConnected || !address) {
    return <WalletConnectionPrompt />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Community Donations
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Contribute to the testnet community and earn exclusive NFT badges
        </p>
      </div>

      {/* User Badges */}
      <UserBadges address={address} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Donation Form */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Make a Donation
            </h2>
            <DonationForm address={address} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Your Donation History
            </h2>
            <DonationHistory address={address} />
          </div>
        </div>

        {/* Right Column - Stats and Contributors */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Donation Statistics
            </h2>
            <DonationStats />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Top Contributors
            </h2>
            <TopContributors />
          </div>
        </div>
      </div>
    </div>
  );
}