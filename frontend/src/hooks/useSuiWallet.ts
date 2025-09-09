'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { useApi } from './useApi';
import toast from 'react-hot-toast';

// Sui wallet types (since we don't have @mysten/wallet-adapter)
interface SuiWallet {
  name: string;
  icon: string;
  accounts: SuiAccount[];
  features: string[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (input: { message: Uint8Array }) => Promise<{ signature: string }>;
}

interface SuiAccount {
  address: string;
  publicKey?: Uint8Array;
}

interface SuiWalletContextType {
  wallet: SuiWallet | null;
  account: SuiAccount | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
}

const SuiWalletContext = createContext<SuiWalletContextType | undefined>(undefined);

export function SuiWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<SuiWallet | null>(null);
  const [account, setAccount] = useState<SuiAccount | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { getNonce, login: apiLogin } = useApi();

  const connected = !!wallet && !!account;

  // Check for Sui wallet (Sui Wallet, Ethos, etc.)
  const detectWallet = (): SuiWallet | null => {
    if (typeof window === 'undefined') return null;

    // Check for Sui Wallet
    const suiWallet = (window as any).suiWallet;
    if (suiWallet) {
      return {
        name: 'Sui Wallet',
        icon: '/sui-logo.png',
        accounts: [],
        features: ['sui:connect', 'sui:signMessage'],
        connect: async () => {
          const result = await suiWallet.connect();
          setAccount(result.accounts[0]);
        },
        disconnect: async () => {
          await suiWallet.disconnect();
          setAccount(null);
        },
        signMessage: async (input: { message: Uint8Array }) => {
          return await suiWallet.signMessage(input);
        },
      };
    }

    // Check for other Sui wallets...
    return null;
  };

  const connect = async () => {
    setConnecting(true);
    try {
      const detectedWallet = detectWallet();
      if (!detectedWallet) {
        toast.error('No Sui wallet found. Please install Sui Wallet extension.');
        return;
      }

      await detectedWallet.connect();
      setWallet(detectedWallet);
      
      toast.success('Sui wallet connected!');
    } catch (error: any) {
      console.error('Sui wallet connection error:', error);
      toast.error(error.message || 'Failed to connect Sui wallet');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    if (wallet) {
      wallet.disconnect().catch(console.error);
    }
    setWallet(null);
    setAccount(null);
    toast.success('Sui wallet disconnected');
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!wallet || !account) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      const messageBytes = new TextEncoder().encode(message);
      const result = await wallet.signMessage({ message: messageBytes });
      return result.signature;
    } catch (error: any) {
      console.error('Message signing error:', error);
      toast.error('Failed to sign message');
      return null;
    }
  };

  // Auto-detect wallet on mount
  useEffect(() => {
    const detected = detectWallet();
    if (detected) {
      setWallet(detected);
    }
  }, []);

  return (
    <SuiWalletContext.Provider
      value={{
        wallet,
        account,
        connected,
        connecting,
        connect,
        disconnect,
        signMessage,
      }}
    >
      {children}
    </SuiWalletContext.Provider>
  );
}

export function useSuiWallet() {
  const context = useContext(SuiWalletContext);
  if (context === undefined) {
    throw new Error('useSuiWallet must be used within a SuiWalletProvider');
  }
  return context;
}

// Sui 컨트랙트 상호작용 훅
export function useSuiContract() {
  const { account } = useSuiWallet();
  const [loading, setLoading] = useState(false);

  const packageId = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID;
  const poolObjectId = process.env.NEXT_PUBLIC_SUI_POOL_OBJECT_ID;

  // 파우셋 요청 (실제로는 Sui 네트워크의 공식 파우셋 사용)
  const requestFaucet = async () => {
    if (!account) {
      toast.error('Sui wallet not connected');
      return null;
    }

    setLoading(true);
    try {
      // Sui testnet 공식 파우셋 사용
      const faucetUrl = `https://faucet.testnet.sui.io/v1/gas?address=${account.address}`;
      const response = await fetch(faucetUrl, { method: 'POST' });
      
      if (response.ok) {
        const result = await response.json();
        toast.success('SUI tokens received from faucet!');
        return result;
      } else {
        toast.error('Faucet request failed');
        return null;
      }
    } catch (error) {
      console.error('Sui faucet error:', error);
      toast.error('Failed to request SUI tokens');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 기부 (추후 구현)
  const donate = async (amount: string, message = '') => {
    if (!account || !packageId || !poolObjectId) {
      toast.error('Sui wallet or contract not configured');
      return null;
    }

    // TODO: Sui Move 컨트랙트 호출 구현
    toast.info('Sui donation feature coming soon!');
    return null;
  };

  return {
    loading,
    isContractAvailable: !!packageId && !!poolObjectId,
    requestFaucet,
    donate,
  };
}