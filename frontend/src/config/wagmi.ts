import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, polygonMumbai, bscTestnet, arbitrumSepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Testnet Faucet Manager',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-wallet-connect-project-id',
  chains: [
    sepolia,
    polygonMumbai,
    bscTestnet,
    arbitrumSepolia,
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
    id: 'polygon',
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    chainId: polygonMumbai.id,
    rpcUrl: polygonMumbai.rpcUrls.default.http[0],
    blockExplorer: polygonMumbai.blockExplorers?.default.url,
    faucetUrl: 'https://faucet.polygon.technology',
    color: '#8247E5',
  },
  {
    id: 'bsc',
    name: 'BSC Testnet',
    symbol: 'BNB',
    chainId: bscTestnet.id,
    rpcUrl: bscTestnet.rpcUrls.default.http[0],
    blockExplorer: bscTestnet.blockExplorers?.default.url,
    faucetUrl: 'https://testnet.binance.org/faucet-smart',
    color: '#F3BA2F',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    chainId: arbitrumSepolia.id,
    rpcUrl: arbitrumSepolia.rpcUrls.default.http[0],
    blockExplorer: arbitrumSepolia.blockExplorers?.default.url,
    faucetUrl: 'https://bridge.arbitrum.io',
    color: '#28A0F0',
  },
];