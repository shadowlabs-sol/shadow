-- CreateEnum
CREATE TYPE "public"."AuctionType" AS ENUM ('SEALED', 'DUTCH', 'BATCH');

-- CreateEnum
CREATE TYPE "public"."AuctionStatus" AS ENUM ('CREATED', 'ACTIVE', 'ENDED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ComputationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."Auction" (
    "id" TEXT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "creator" TEXT NOT NULL,
    "assetMint" TEXT NOT NULL,
    "assetVault" TEXT,
    "type" "public"."AuctionType" NOT NULL,
    "status" "public"."AuctionStatus" NOT NULL DEFAULT 'CREATED',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "minimumBid" BIGINT NOT NULL,
    "reservePriceEncrypted" BYTEA,
    "reservePriceNonce" TEXT,
    "currentPrice" BIGINT,
    "priceDecreaseRate" BIGINT,
    "startingPrice" BIGINT,
    "bidCount" INTEGER NOT NULL DEFAULT 0,
    "winner" TEXT,
    "winningAmount" BIGINT,
    "settledAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bid" (
    "id" TEXT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "auctionDbId" TEXT NOT NULL,
    "bidder" TEXT NOT NULL,
    "amountEncrypted" BYTEA NOT NULL,
    "encryptionPublicKey" BYTEA,
    "nonce" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Settlement" (
    "id" TEXT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "auctionDbId" TEXT NOT NULL,
    "winner" TEXT NOT NULL,
    "winningAmount" BIGINT NOT NULL,
    "settlementTime" TIMESTAMP(3) NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "mpcComputationId" TEXT,
    "callbackData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MXEComputation" (
    "id" TEXT NOT NULL,
    "computationOffset" BIGINT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" "public"."ComputationStatus" NOT NULL DEFAULT 'QUEUED',
    "inputData" BYTEA NOT NULL,
    "outputData" BYTEA,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MXEComputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalBids" INTEGER NOT NULL DEFAULT 0,
    "auctionsWon" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Auction_auctionId_key" ON "public"."Auction"("auctionId");

-- CreateIndex
CREATE INDEX "Auction_status_idx" ON "public"."Auction"("status");

-- CreateIndex
CREATE INDEX "Auction_creator_idx" ON "public"."Auction"("creator");

-- CreateIndex
CREATE INDEX "Auction_endTime_idx" ON "public"."Auction"("endTime");

-- CreateIndex
CREATE INDEX "Bid_auctionId_idx" ON "public"."Bid"("auctionId");

-- CreateIndex
CREATE INDEX "Bid_bidder_idx" ON "public"."Bid"("bidder");

-- CreateIndex
CREATE INDEX "Bid_timestamp_idx" ON "public"."Bid"("timestamp");

-- CreateIndex
CREATE INDEX "Settlement_auctionId_idx" ON "public"."Settlement"("auctionId");

-- CreateIndex
CREATE UNIQUE INDEX "MXEComputation_computationOffset_key" ON "public"."MXEComputation"("computationOffset");

-- CreateIndex
CREATE INDEX "MXEComputation_status_idx" ON "public"."MXEComputation"("status");

-- CreateIndex
CREATE INDEX "MXEComputation_programId_idx" ON "public"."MXEComputation"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "public"."User"("walletAddress");

-- AddForeignKey
ALTER TABLE "public"."Bid" ADD CONSTRAINT "Bid_auctionDbId_fkey" FOREIGN KEY ("auctionDbId") REFERENCES "public"."Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Settlement" ADD CONSTRAINT "Settlement_auctionDbId_fkey" FOREIGN KEY ("auctionDbId") REFERENCES "public"."Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
