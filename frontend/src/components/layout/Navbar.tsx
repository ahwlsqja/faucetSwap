'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { useSuiWallet } from '@/hooks/useSuiWallet';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  HeartIcon,
  ChartBarIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { WifiIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Faucet', href: '/faucet', icon: CurrencyDollarIcon },
  { name: 'Donation', href: '/donation', icon: HeartIcon },
  { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  { name: 'Stats', href: '/stats', icon: ChartBarIcon },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected: isWsConnected } = useWebSocket();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { isConnected } = useAccount();
  const { connected: suiConnected, connecting: suiConnecting, connect: connectSui, disconnect: disconnectSui, account: suiAccount } = useSuiWallet();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Testnet Faucet
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* WebSocket Status */}
            <div className="hidden sm:flex items-center space-x-2">
              <WifiIcon
                className={clsx(
                  'h-4 w-4',
                  isWsConnected ? 'text-green-500' : 'text-red-500'
                )}
              />
              <span className="text-xs text-gray-500">
                {isWsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* EVM Connect Button */}
            <ConnectButton />

            {/* Sui Connect Button */}
            {suiConnected ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-800">
                    {suiAccount?.address.slice(0, 6)}...{suiAccount?.address.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={disconnectSui}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Disconnect Sui
                </button>
              </div>
            ) : (
              <button
                onClick={connectSui}
                disabled={suiConnecting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {suiConnecting ? 'Connecting...' : 'Connect Sui'}
              </button>
            )}

            {/* Login/Profile Button */}
            {(isConnected || suiConnected) && (
              <div className="flex items-center space-x-2">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                      <UserIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {user?.address.slice(0, 6)}...{user?.address.slice(-4)}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span className="hidden sm:block">Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={login}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>{isLoading ? 'Signing...' : 'Sign In'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Mobile WebSocket Status */}
            <div className="flex items-center space-x-2 px-3 py-2">
              <WifiIcon
                className={clsx(
                  'h-4 w-4',
                  isWsConnected ? 'text-green-500' : 'text-red-500'
                )}
              />
              <span className="text-sm text-gray-500">
                {isWsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Mobile Sui Status */}
            {suiConnected && (
              <div className="px-3 py-2 border-t border-gray-200 mt-2 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">
                      Sui: {suiAccount?.address.slice(0, 6)}...{suiAccount?.address.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      disconnectSui();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors w-full"
                  >
                    <span>Disconnect Sui</span>
                  </button>
                </div>
              </div>
            )}

            {!suiConnected && (
              <div className="px-3 py-2 border-t border-gray-200 mt-2 pt-4">
                <button
                  onClick={() => {
                    connectSui();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={suiConnecting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors w-full"
                >
                  {suiConnecting ? 'Connecting...' : 'Connect Sui'}
                </button>
              </div>
            )}

            {/* Mobile Auth Status */}
            {(isConnected || suiConnected) && (
              <div className="px-3 py-2 border-t border-gray-200 mt-2 pt-4">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                      <UserIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {user?.address.slice(0, 6)}...{user?.address.slice(-4)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      login();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>{isLoading ? 'Signing...' : 'Sign In'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}