# 백엔드 파일 이동 가이드

## 수정 사항

1. **프리즈마 스키마 수정 완료**
   - `User` 모델에 `badges ContributorBadge[]` 관계 추가
   - 이제 에러가 해결됩니다.

2. **백엔드 폴더 구조 생성 완료**
   ```
   backend/
   ├── package.json
   ├── tsconfig.json
   ├── nest-cli.json
   ├── .env.example
   ├── prisma/
   │   ├── schema.prisma (수정됨)
   │   └── seed.ts
   └── src/
       ├── main.ts
       ├── app.module.ts
       ├── prisma/
       ├── chains/
       ├── user/
       ├── faucet/
       ├── donation/
       ├── scheduler/
       └── websocket/
   ```

## 다음 단계

이제 기존의 `src/` 폴더에 있는 모든 파일들을 `backend/src/`로 복사하고 임포트 경로를 수정해야 합니다.

### 복사해야 할 파일들

1. **User 모듈**
   - `src/user/user.service.ts` → `backend/src/user/user.service.ts`
   - `src/user/user.controller.ts` → `backend/src/user/user.controller.ts`

2. **Faucet 모듈**
   - `src/faucet/` 전체 → `backend/src/faucet/`

3. **Donation 모듈**
   - `src/donation/` 전체 → `backend/src/donation/`

4. **Scheduler 모듈**
   - `src/scheduler/` 전체 → `backend/src/scheduler/`

5. **WebSocket 모듈**
   - `src/websocket/` 전체 → `backend/src/websocket/`

### 실행 방법

```bash
# 백엔드 폴더로 이동
cd backend

# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 시드 데이터 생성
npx prisma db seed

# 개발 서버 시작
npm run start:dev
```

### 프론트엔드 API URL 수정

`frontend/src/hooks/useApi.ts`에서 API_BASE_URL이 백엔드 포트를 올바르게 가리키는지 확인:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
```

## 주요 수정사항 요약

✅ **해결된 문제**: 프리즈마 스키마에서 `ContributorBadge` 모델의 관계 에러 수정
✅ **구조 개선**: 백엔드 코드를 별도 `backend/` 폴더로 분리
✅ **프로젝트 구조**: 루트 폴더가 더 깔끔하게 정리됨

```
faucet_management/
├── backend/           # NestJS 백엔드
├── frontend/          # Next.js 프론트엔드
├── contracts/         # 스마트 컨트랙트
└── README.md
```