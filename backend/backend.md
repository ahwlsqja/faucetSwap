  1단계: MetaMask 네트워크 추가

  Polygon Mumbai 추가:

  Network Name: Polygon Mumbai
  RPC URL: https://rpc-mumbai.maticvigil.com
  Chain ID: 80001
  Currency Symbol: MATIC
  Block Explorer: https://mumbai.polygonscan.com

  BSC Testnet 추가:

  Network Name: BSC Testnet
  RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
  Chain ID: 97
  Currency Symbol: BNB
  Block Explorer: https://testnet.bscscan.com

  2단계: 테스트 토큰 받기

  Mumbai MATIC 받기:
  - https://faucet.polygon.technology 접속
  - 지갑 주소 입력하고 MATIC 받기

  BSC Testnet BNB 받기:
  - https://testnet.binance.org/faucet-smart 접속
  - 지갑 주소 입력하고 tBNB 받기

  3단계: Remix에서 컨트랙트 배포

  1. remix.ethereum.org 접속
  2. AutoFaucetPool.sol 코드 복사해서 새 파일 생성
  3. Compile 탭에서 컴파일
  4. Deploy 탭에서:
    - Environment: "Injected Provider - MetaMask"
    - MetaMask에서 Mumbai 선택
    - Deploy 버튼 클릭 → Mumbai 컨트랙트 주소 복사
    - MetaMask에서 BSC Testnet 선택
    - Deploy 버튼 클릭 → BSC 컨트랙트 주소 복사

  4단계: 환경변수 설정

  .env 파일에 추가:

  # Contract Addresses
  ETHEREUM_CONTRACT=0x이미_배포한_세폴리아_주소
  POLYGON_CONTRACT=0x방금_배포한_뭄바이_주소
  BSC_CONTRACT=0x방금_배포한_BSC_주소

  # RPC URLs (선택사항)
  POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
  BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545