import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Testnet Faucet Manager',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-wallet-connect-project-id',
  chains: [
    sepolia,
  ],
  ssr: true,
});

export const supportedChains = [
  {
    id: 'ethereum',
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    chainId: sepolia.id,
    rpcUrl: sepolia.rpcUrls.default.http[0],
    blockExplorer: sepolia.blockExplorers?.default.url,
    faucetUrl: 'https://sepoliafaucet.com',
    color: '#627EEA',
  },
  {
    id: 'sui',
    name: 'Sui Testnet',
    symbol: 'SUI',
    chainId: 0, // Sui는 EVM이 아니므로 0
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    blockExplorer: 'https://suiexplorer.com',
    faucetUrl: 'https://docs.sui.io/testnet',
    color: '#4DA2FF',
  },
];