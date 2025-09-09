# 🚰 Faucet Management System

A comprehensive Web3 faucet management platform supporting multiple blockchain networks with integrated donation pools and user authentication.

## 🌟 Features

- **Multi-Chain Support**: Ethereum Sepolia, Sui Testnet
- **Wallet Authentication**: Web3 wallet signature-based login (MetaMask, Sui Wallet)
- **Smart Contract Integration**: Direct interaction with faucet contracts
- **Donation System**: Community-driven faucet pools
- **Real-time Updates**: WebSocket notifications
- **Admin Dashboard**: Faucet management and statistics
- **Responsive UI**: Modern React/Next.js interface

## 🏗️ Tech Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Web3 signature verification
- **Blockchain**: ethers.js (EVM), @mysten/sui (Sui)
- **Caching**: Redis
- **API**: RESTful with Swagger documentation

### Frontend
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **Wallet Integration**: wagmi + RainbowKit (EVM), Custom Sui integration
- **State Management**: React Context + TanStack Query
- **UI Components**: Headless UI, Heroicons
- **Charts**: Recharts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis (optional, for caching)
- MetaMask or other Web3 wallet
- Sui Wallet (for Sui features)

### Backend Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd faucet_management/backend
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database setup:**
```bash
# Create PostgreSQL database named 'faucetswap'
createdb faucetswap

# Generate Prisma client and apply schema
npx prisma generate
npx prisma db push

# Seed initial data (optional)
npx prisma db seed
```

4. **Start backend server:**
```bash
npm run start:dev
# Server runs on http://localhost:3000
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd ../frontend
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start frontend server:**
```bash
npm run dev
# App runs on http://localhost:3001
```

## 🔧 Configuration

### Required Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/faucetswap?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Server
PORT=3000
FRONTEND_URL="http://localhost:3001"

# Ethereum (Sepolia)
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/your-infura-project-id"
ETHEREUM_CONTRACT="0x9490937f71ab055afe3a2df4f143554d0b0fd8bd"

# Sui Testnet
SUI_RPC_URL="https://fullnode.testnet.sui.io:443"
SUI_PACKAGE_ID="0x8f48a0c7550a4b7a0123db0d60ebceda6d60af20a3d5765920409fb3a7db5da0"
SUI_POOL_OBJECT_ID="0x19a124473ced6405e821aa238e5921de7bf05dcdf152bf6172ed898584458317"
```

#### Frontend (.env)
```env
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000

# WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-wallet-connect-project-id

# Contract Addresses
NEXT_PUBLIC_ETHEREUM_CONTRACT=0x9490937f71ab055afe3a2df4f143554d0b0fd8bd
NEXT_PUBLIC_SUI_PACKAGE_ID=0x8f48a0c7550a4b7a0123db0d60ebceda6d60af20a3d5765920409fb3a7db5da0
NEXT_PUBLIC_SUI_POOL_OBJECT_ID=0x19a124473ced6405e821aa238e5921de7bf05dcdf152bf6172ed898584458317
```

## 📱 Usage

### For Users

1. **Connect Wallet**: Use MetaMask for Ethereum or Sui Wallet for Sui
2. **Sign In**: Authenticate by signing a message with your wallet
3. **Request Tokens**: 
   - Choose between official faucets or community pools
   - Wait for cooldown periods between requests
4. **Donate**: Contribute to community pools to help other users
5. **View History**: Track your faucet requests and donations

### For Developers

#### API Endpoints

- **Authentication**: `POST /auth/login`, `GET /auth/profile`
- **Faucet**: `POST /faucet/request`, `GET /faucet/cooldown/:address`
- **Statistics**: `GET /faucet/statistics`, `GET /donation/stats`

#### Smart Contract Integration

```typescript
// Request faucet tokens
const { requestFaucet } = useFaucet();
await requestFaucet({ chain: 'ethereum', source: 'COMMUNITY_POOL' });

// Make donation
const { donate } = useDonation();
await donate({ chain: 'ethereum', amount: '0.1', message: 'Keep it up!' });
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend Tests
```bash
cd frontend
npm run test
npm run build # Test build
```

### Database Reset
```bash
cd backend
npx prisma db push --force-reset
```

## 🔒 Security

- **Wallet Signature Verification**: All authentication via cryptographic signatures
- **JWT Tokens**: Secure API access
- **Cooldown Mechanisms**: Prevent spam and abuse
- **Input Validation**: Comprehensive request validation
- **Environment Isolation**: Separate configs for dev/prod

## 🚀 Deployment

### Production Environment Variables

Update `.env` files with production values:
- Database URLs
- RPC endpoints
- Contract addresses
- JWT secrets
- CORS origins

### Recommended Stack
- **Database**: Supabase, AWS RDS, or Railway PostgreSQL
- **Backend**: Railway, Render, or AWS
- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Cache**: Redis Cloud or AWS ElastiCache

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create GitHub issues for bugs or feature requests
- **Documentation**: Check documentation files for detailed guides

---

Built with ❤️ for the Web3 community