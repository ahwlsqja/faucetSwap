'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WalletIcon, CurrencyDollarIcon, GiftIcon, TrophyIcon } from '@heroicons/react/24/outline';

export function WalletConnectionPrompt() {
  const features = [
    {
      icon: CurrencyDollarIcon,
      title: 'Multi-Chain Faucets',
      description: 'Request testnet tokens from multiple chains including Ethereum, Polygon, BSC, and Arbitrum.',
    },
    {
      icon: GiftIcon,
      title: 'Community Donations',
      description: 'Contribute your unused testnet tokens to help other developers in the community.',
    },
    {
      icon: TrophyIcon,
      title: 'NFT Badges',
      description: 'Earn exclusive NFT badges based on your contributions to the testnet community.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto text-center">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <WalletIcon className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Testnet Faucet Manager
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The ultimate platform for managing testnet tokens across multiple blockchains.
          Connect your wallet to get started!
        </p>

        <div className="mb-8">
          <ConnectButton />
        </div>

        <p className="text-sm text-gray-500">
          Connect your wallet to access all features and start managing your testnet tokens.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {features.map((feature) => (
          <div key={feature.title} className="card p-6 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <feature.icon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Stats Preview */}
      <div className="card p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Community Impact
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">10,000+</div>
            <div className="text-sm text-gray-600">Tokens Distributed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">500+</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">4</div>
            <div className="text-sm text-gray-600">Supported Chains</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">250+</div>
            <div className="text-sm text-gray-600">NFT Badges Minted</div>
          </div>
        </div>
      </div>
    </div>
  );
}