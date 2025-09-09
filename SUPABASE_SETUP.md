# 🗄️ Supabase 데이터베이스 설정 가이드

## 1. Supabase 연결 정보 확인

### Supabase 대시보드에서 연결 정보 찾기:
1. **Supabase 대시보드** → 프로젝트 선택
2. **Settings** → **Database**
3. **Connection Info** 섹션에서 다음 정보 확인:

```
Host: db.[YOUR_PROJECT_REF].supabase.co
Database: postgres  
Port: 5432
User: postgres
Password: [YOUR_DB_PASSWORD]
```

## 2. 백엔드 .env 파일 업데이트

`backend/.env` 파일의 `DATABASE_URL`을 다음과 같이 수정:

```env
# 실제 값으로 교체하세요
DATABASE_URL="postgresql://postgres:your-actual-password@db.your-project-ref.supabase.co:5432/postgres"
```

### 예시:
```env
# 예시 (실제 값으로 교체 필요)
DATABASE_URL="postgresql://postgres:your-super-secret-password@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

## 3. 데이터베이스 초기화

백엔드 디렉토리에서 다음 명령어 실행:

```bash
cd backend

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 적용 (테이블 생성)
npx prisma db push

# 초기 데이터 시드 (옵션)
npx prisma db seed
```

## 4. 연결 테스트

다음 명령어로 데이터베이스 연결 테스트:

```bash
# 백엔드 서버 실행
npm run start:dev
```

서버가 성공적으로 시작되고 데이터베이스 연결 로그가 나타나면 성공!

## 5. Supabase에서 테이블 확인

1. **Supabase 대시보드** → **Table Editor**
2. 다음 테이블들이 생성되었는지 확인:
   - `users`
   - `user_wallets`  
   - `faucet_requests`
   - `donations`
   - `faucet_configs`
   - `donation_pools`

## 6. 환경변수 보안

⚠️ **중요**: 실제 DATABASE_URL은 절대 Git에 커밋하지 마세요!

```bash
# .env 파일이 .gitignore에 포함되어 있는지 확인
echo ".env" >> .gitignore
```

## 7. 트러블슈팅

### 연결 오류가 발생하는 경우:

1. **비밀번호 확인**: Supabase에서 정확한 DB 비밀번호 사용
2. **프로젝트 참조 확인**: `db.[PROJECT_REF].supabase.co` 형식 맞는지 확인
3. **방화벽**: Supabase는 기본적으로 모든 IP에서 접근 가능
4. **SSL**: Supabase는 기본적으로 SSL 연결 요구

### Prisma 오류가 발생하는 경우:

```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 스키마 강제 재적용
npx prisma db push --force-reset
```

## 8. 운영 환경 설정

운영 환경에서는 다음과 같이 설정:

```env
# 운영 환경 .env
NODE_ENV="production"
DATABASE_URL="postgresql://postgres:prod-password@db.prod-ref.supabase.co:5432/postgres"
```

---

## ✅ 설정 완료 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 비밀번호 확인
- [ ] backend/.env 파일 업데이트
- [ ] `npx prisma generate` 실행
- [ ] `npx prisma db push` 실행
- [ ] 백엔드 서버 실행 테스트
- [ ] Supabase에서 테이블 생성 확인

모든 단계가 완료되면 Supabase PostgreSQL 연결이 완료됩니다! 🎉