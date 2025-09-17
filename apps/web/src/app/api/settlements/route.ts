import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Find the auction
    const auction = await prisma.auction.findFirst({
      where: { auctionId: BigInt(body.auctionId) }
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Create settlement record
    const settlement = await prisma.settlement.create({
      data: {
        auctionId: BigInt(body.auctionId),
        auctionDbId: auction.id,
        winner: body.winner,
        winningAmount: BigInt(body.winningAmount),
        settlementTime: new Date(),
        transactionHash: body.transactionHash,
        mpcComputationId: body.mpcComputationId,
        callbackData: body.callbackData ? Buffer.from(body.callbackData) : null
      }
    });

    // Update auction status and winner
    await prisma.auction.update({
      where: { id: auction.id },
      data: {
        status: 'SETTLED',
        winner: body.winner,
        winningAmount: BigInt(body.winningAmount),
        settledAt: new Date()
      }
    });

    // Update winning bid
    if (body.winner) {
      await prisma.bid.updateMany({
        where: {
          auctionDbId: auction.id,
          bidder: body.winner
        },
        data: {
          isWinner: true
        }
      });

      // Update user stats
      await prisma.user.update({
        where: { walletAddress: body.winner },
        data: {
          auctionsWon: { increment: 1 },
          totalVolume: { increment: BigInt(body.winningAmount) }
        }
      });
    }

    return NextResponse.json({
      ...settlement,
      auctionId: settlement.auctionId.toString(),
      winningAmount: settlement.winningAmount.toString()
    });
  } catch (error) {
    console.error('Failed to process settlement:', error);
    return NextResponse.json(
      { error: 'Failed to process settlement' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const auctionId = searchParams.get('auctionId');

    const where: any = {};
    
    if (auctionId) {
      where.auctionId = BigInt(auctionId);
    }

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        auction: {
          select: {
            id: true,
            auctionId: true,
            type: true,
            creator: true,
            assetMint: true
          }
        }
      },
      orderBy: {
        settlementTime: 'desc'
      }
    });

    return NextResponse.json(settlements.map((settlement: any) => ({
      ...settlement,
      auctionId: settlement.auctionId.toString(),
      winningAmount: settlement.winningAmount.toString(),
      auction: {
        ...settlement.auction,
        auctionId: settlement.auction.auctionId.toString()
      }
    })));
  } catch (error) {
    console.error('Failed to fetch settlements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}