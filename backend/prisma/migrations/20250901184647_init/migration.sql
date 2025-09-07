-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" TEXT NOT NULL DEFAULT '0',
    "lastBalanceCheck" TIMESTAMP(3),

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faucet_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "txHash" TEXT,
    "errorReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cooldownUntil" TIMESTAMP(3),

    CONSTRAINT "faucet_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faucet_configs" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "rpcUrl" TEXT NOT NULL,
    "faucetUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "maxAmount" TEXT NOT NULL DEFAULT '0.1',
    "minBalance" TEXT NOT NULL DEFAULT '0.01',

    CONSTRAINT "faucet_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_pools" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "totalAmount" TEXT NOT NULL DEFAULT '0',
    "available" TEXT NOT NULL DEFAULT '0',
    "distributed" TEXT NOT NULL DEFAULT '0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "badgeLevel" TEXT NOT NULL,
    "totalDonated" TEXT NOT NULL,
    "mintedAt" TIMESTAMP(3) NOT NULL,
    "txHash" TEXT NOT NULL,

    CONSTRAINT "contributor_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_address_key" ON "users"("address");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_userId_chain_key" ON "user_wallets"("userId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "donations_txHash_key" ON "donations"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "faucet_configs_chain_key" ON "faucet_configs"("chain");

-- CreateIndex
CREATE UNIQUE INDEX "donation_pools_chain_key" ON "donation_pools"("chain");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_badges_tokenId_key" ON "contributor_badges"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_badges_txHash_key" ON "contributor_badges"("txHash");

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faucet_requests" ADD CONSTRAINT "faucet_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_badges" ADD CONSTRAINT "contributor_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
