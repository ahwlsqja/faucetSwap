# 배포된 컨트랙트 정보

이 폴더에는 각 네트워크별로 배포된 컨트랙트 정보가 저장됩니다.

## 파일 형식
- `sepolia_deployment.json` - Sepolia 테스트넷 배포 정보
- `mumbai_deployment.json` - Polygon Mumbai 배포 정보
- `bscTestnet_deployment.json` - BSC 테스트넷 배포 정보

## 배포 정보 구조
```json
{
  "address": "0x...",
  "network": "sepolia",
  "chainId": 11155111,
  "deployedAt": "2024-08-26T...",
  "verified": false,
  "verifiedAt": null,
  "deployer": "0x...",
  "transactionHash": "0x..."
}
```

## 사용 방법

### 배포
```bash
npm run deploy:sepolia
```

### 검증
```bash
npm run verify -- --network sepolia
```

### 상호작용
```bash
npx hardhat run scripts/interact.js --network sepolia
```