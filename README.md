# FaucetSwap 🚀

**Multi-Chain Testnet Faucet Manager** - 완전 탈중앙화된 테스트넷 토큰 Faucet 시스템

유니스왑처럼 완전히 탈중앙화된 테스트넷 토큰 Faucet입니다. 스마트 컨트랙트가 모든 로직을 처리하고, 백엔드는 통계와 편의 기능만 제공합니다.

## 🌟 주요 특징

- **🔥 완전 탈중앙화**: 유니스왑처럼 스마트 컨트랙트가 모든 로직 처리
- **⚡ 즉시 토큰 받기**: 24시간 쿨다운 후 승인 없이 자동 지급
- **🌐 멀티체인 지원**: EVM (Ethereum, Polygon, BSC) + Sui 체인
- **🏆 NFT 배지 시스템**: 기여도 기반 자동 배지 발급
- **📊 실시간 통계**: 대시보드와 풍부한 API 제공
- **🕒 쿨다운 헬퍼**: 백엔드에서 편리한 쿨다운 조회

## 🏗️ 아키텍처

```
사용자 → 프론트엔드 → 스마트 컨트랙트 (직접 호출)
             ↓
       백엔드 API (통계/쿨다운 조회용)
```

### 스마트 컨트랙트 중심 설계
- **기부**: 컨트랙트로 직접 전송
- **Faucet 요청**: 쿨다운 체크 후 즉시 지급
- **백엔드**: 읽기 전용 통계/헬퍼 기능만

### 📁 프로젝트 구조

```
faucet_management/
├── backend/                 # NestJS 백엔드 API
│   ├── src/
│   │   ├── chains/         # 체인 관리 모듈
│   │   ├── nft/           # NFT 배지 시스템
│   │   ├── user/          # 사용자 관리
│   │   └── prisma/        # 데이터베이스
│   └── prisma/
├── contracts/              # 스마트 컨트랙트
│   ├── AutoFaucetPool.sol  # EVM 체인용
│   └── sui/
│       └── sources/
│           └── faucet_pool.move  # Sui 체인용
└── frontend/              # Next.js 프론트엔드
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (for caching)
- Ethereum wallet with testnet tokens

### Backend Setup

1. **Install dependencies**
```bash
cd faucet_management
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database and RPC URLs
```

3. **Database setup**
```bash
npx prisma migrate dev
npx prisma db seed
```

4. **Start the backend**
```bash
npm run start:dev
```

### Frontend Setup

1. **Install frontend dependencies**
```bash
cd frontend
npm install
```

2. **Configure environment**
```bash
# Create .env.local with:
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id
```

3. **Start the frontend**
```bash
npm run dev
```

### Smart Contract Deployment

1. **Setup Hardhat**
```bash
cd contracts
npm install
```

2. **Deploy contracts**
```bash
# For Sepolia testnet
npm run deploy:sepolia

# For Mumbai testnet  
npm run deploy:mumbai
```

3. **Update backend configuration**
```bash
# Add deployed contract addresses to backend .env
DONATION_CONTRACT_ADDRESS=0x...
NFT_BADGE_CONTRACT_ADDRESS=0x...
```

## 📋 API Documentation

### User Management
- `POST /users` - Create new user
- `GET /users/address/:address` - Get user by wallet address
- `GET /users/:id/stats` - Get user statistics
- `POST /users/:id/wallets` - Add wallet for chain

### Faucet Operations
- `POST /faucet/request` - Request tokens from faucet
- `GET /faucet/status/:userId` - Get faucet status for all chains
- `GET /faucet/history/:userId` - Get request history
- `GET /faucet/stats` - Get global faucet statistics

### Donation System
- `POST /donation` - Record new donation
- `GET /donation/history/:userId` - Get donation history
- `GET /donation/pools` - Get all donation pools
- `GET /donation/badges/:userId` - Get user's NFT badges
- `GET /donation/leaderboard` - Get contributor rankings

### WebSocket Events
- `balance-updated` - Balance changes
- `faucet-updated` - Faucet request results
- `cooldown-updated` - Cooldown expiration
- `donation-updated` - Donation confirmations
- `badge_minted` - New NFT badge earned

## 🎨 Frontend Components

### Dashboard
- **FaucetStatusGrid**: Display all chain statuses with request buttons
- **UserStats**: Personal statistics and achievements
- **DonationPools**: Community pool status and utilization
- **RecentActivity**: Latest requests and donations

### Donation System
- **DonationForm**: Multi-chain donation interface
- **UserBadges**: NFT badge collection display
- **DonationHistory**: Personal donation timeline
- **TopContributors**: Community leaderboard

## 🔧 Configuration

### Supported Chains
Configure chains in `src/config/wagmi.ts`:
```typescript
export const supportedChains = [
  {
    id: 'ethereum',
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/...',
    faucetUrl: 'https://sepoliafaucet.com',
    color: '#627EEA',
  },
  // Add more chains...
];
```

### Badge Levels
NFT badges are earned at these contribution levels:
- 🥉 **Bronze**: 0.1+ ETH equivalent
- 🥈 **Silver**: 1+ ETH equivalent  
- 🥇 **Gold**: 5+ ETH equivalent
- 💎 **Diamond**: 10+ ETH equivalent

## 🧪 Testing

### Backend Tests
```bash
npm run test
npm run test:e2e
```

### Frontend Tests
```bash
cd frontend
npm run test
npm run type-check
```

### Contract Tests
```bash
cd contracts
npx hardhat test
```

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Start production server: `npm run start:prod`
3. Run database migrations: `npx prisma migrate deploy`

### Frontend Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `*_RPC_URL`: RPC endpoints for each chain
- `*_FAUCET_URL`: Official faucet URLs
- `DONATION_CONTRACT_ADDRESS`: Deployed contract address

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Create an issue for bug reports or feature requests
- Join our Discord community for discussions
- Check the documentation for detailed guides

## 🌟 Acknowledgments

- OpenZeppelin for smart contract libraries
- wagmi and RainbowKit for Web3 integration
- NestJS and Next.js communities for excellent frameworks
- All testnet faucet providers for supporting development

---

Built with ❤️ for the blockchain developer community