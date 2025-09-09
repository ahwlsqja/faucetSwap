# 🔗 Faucet Management Integration Guide

## ✅ 통합 완료 상태

### 백엔드 ↔ 프론트엔드 통합
- **인증**: JWT 기반 지갑 서명 인증 완료
- **API**: 모든 엔드포인트 백엔드 구조에 맞게 수정
- **데이터베이스**: Prisma + PostgreSQL 통합

### 스마트 컨트랙트 통합
- **EVM 체인**: Ethereum Sepolia, BSC Testnet 지원
- **Sui 체인**: Sui Testnet 지원 (백엔드만)
- **프론트엔드**: Wagmi + Viem으로 컨트랙트 상호작용

## 🚀 주요 기능

### 1. 인증 시스템 (`useAuth`)
```typescript
const { user, isAuthenticated, login, logout } = useAuth();

// 지갑 연결 후 로그인
await login(); // 메시지 서명으로 인증
```

### 2. API 통합 (`useApi`)
```typescript
const api = useApi();

// 인증 관련
await api.getNonce();
await api.login({ address, signature, message });
await api.getProfile();

// 파우셋 관련
await api.requestFaucet({ chain: 'ethereum', source: 'COMMUNITY_POOL' });
await api.getCooldownStatus(address, 'ethereum');
await api.getFaucetHistory(address);

// 기부 관련  
await api.createDonation({ userId, chain, token, amount, txHash });
```

### 3. 컨트랙트 상호작용 (`useContract`)
```typescript
const contract = useContract();

// 사용자 정보 조회
const info = await contract.getUserContractInfo();
// { canClaim, cooldownRemaining, contributionLevel, totalDonated }

// 파우셋 요청
const txHash = await contract.requestFaucet();

// 기부
const txHash = await contract.donate('0.1', 'Thanks for the faucet!');

// 풀 통계
const stats = await contract.getPoolStats();
```

### 4. 통합 훅들
```typescript
// 파우셋 통합 훅
const { requestFaucet, checkCooldown } = useFaucet();

// 기부 통합 훅
const { donate, getStats } = useDonation();
```

## 🔧 설정 방법

### 1. 환경 변수 설정
```env
# 프론트엔드 (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_ETHEREUM_CONTRACT=0x...
NEXT_PUBLIC_BSC_CONTRACT=0x...

# 백엔드 (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/faucet_db"
JWT_SECRET=your-jwt-secret
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
ETHEREUM_CONTRACT=0x...
BSC_CONTRACT=0x...
```

### 2. 데이터베이스 초기화
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

## 📊 API 엔드포인트 매핑

| 기능 | 프론트엔드 | 백엔드 | 인증 필요 |
|------|------------|---------|-----------|
| 로그인 | `POST /auth/login` | `POST /auth/login` | ❌ |
| 논스 생성 | `GET /auth/nonce` | `GET /auth/nonce` | ❌ |
| 프로필 조회 | `GET /auth/profile` | `GET /auth/profile` | ✅ |
| 파우셋 요청 | `POST /faucet/request` | `POST /faucet/request` | ✅ |
| 쿨다운 확인 | `GET /faucet/cooldown/:address` | `GET /faucet/cooldown/:address` | ❌ |
| 파우셋 히스토리 | `GET /faucet/history/:address` | `GET /faucet/history/:address` | ❌ |
| 파우셋 통계 | `GET /faucet/statistics` | `GET /faucet/statistics` | ❌ |

## 🔄 통합 플로우

### 파우셋 요청 플로우
1. **사용자 인증**: 지갑 연결 + 메시지 서명
2. **쿨다운 확인**: DB + 컨트랙트 상태 확인
3. **요청 생성**: 백엔드에 요청 기록
4. **소스 분기**:
   - **공식 파우셋**: 외부 URL로 리다이렉트
   - **커뮤니티 풀**: 스마트 컨트랙트 호출
5. **트랜잭션 처리**: 컨트랙트 상호작용
6. **상태 업데이트**: 백엔드에 결과 업데이트

### 기부 플로우
1. **사용자 인증 확인**
2. **스마트 컨트랙트 호출**: `donate()` 함수 실행
3. **트랜잭션 확인 대기**
4. **백엔드 기록**: 기부 내역 저장
5. **UI 업데이트**: 성공 메시지 및 통계 업데이트

## 🎯 사용법

### Navbar에서 로그인
```typescript
// 지갑 연결 후 자동으로 로그인 버튼 표시
// 클릭시 메시지 서명 후 JWT 토큰 저장
```

### 파우셋 페이지에서 요청
```typescript
const { requestFaucet } = useFaucet();

// 공식 파우셋 사용
await requestFaucet({ 
  chain: 'ethereum', 
  source: 'OFFICIAL_FAUCET' 
});

// 커뮤니티 풀 사용 (컨트랙트 호출)
await requestFaucet({ 
  chain: 'ethereum', 
  source: 'COMMUNITY_POOL' 
});
```

### 기부 페이지에서 기부
```typescript
const { donate } = useDonation();

await donate({
  chain: 'ethereum',
  amount: '0.1',
  message: 'Keep up the great work!'
});
```

## ⚠️ 주의사항

1. **환경 변수 필수**: 컨트랙트 주소와 RPC URL 설정 필요
2. **지갑 연결**: 모든 기능 사용 전 지갑 연결 + 로그인 필요
3. **네트워크 매칭**: 지갑 네트워크와 요청 체인 일치 확인
4. **가스비 준비**: 컨트랙트 상호작용시 가스비 필요
5. **에러 처리**: 모든 비동기 작업에 try-catch 적용

통합이 완료되어 백엔드-컨트랙트-프론트엔드가 완전히 연동됩니다! 🎉