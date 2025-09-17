import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const auctionId = searchParams.get('auctionId');
    const bidder = searchParams.get('bidder');

    const where: any = {};
    
    if (auctionId) {
      where.auctionId = BigInt(auctionId);
    }
    
    if (bidder) {
      where.bidder = bidder;
    }

    const bids = await prisma.bid.findMany({
      where,
      include: {
        auction: {
          select: {
            id: true,
            auctionId: true,
            type: true,
            status: true,
            endTime: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return NextResponse.json(bids.map((bid: any) => ({
      ...bid,
      auctionId: bid.auctionId.toString(),
      auction: {
        ...bid.auction,
        auctionId: bid.auction.auctionId.toString()
      }
    })));
  } catch (error) {
    console.error('Failed to fetch bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Find the auction - handle both string and number auction IDs
    const auctionIdBigInt = BigInt(body.auctionId);
    const auction = await prisma.auction.findFirst({
      where: { auctionId: auctionIdBigInt }
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Create the bid
    const bid = await prisma.bid.create({
      data: {
        auctionId: auctionIdBigInt,
        auctionDbId: auction.id,
        bidder: body.bidder,
        amountEncrypted: Buffer.from(body.amountEncrypted),
        encryptionPublicKey: body.encryptionPublicKey ? Buffer.from(body.encryptionPublicKey) : null,
        nonce: body.nonce.toString(),
        timestamp: new Date(),
        transactionHash: body.transactionHash
      }
    });

    // Update auction bid count
    await prisma.auction.update({
      where: { id: auction.id },
      data: { 
        bidCount: { increment: 1 }
      }
    });

    // Update user stats
    await prisma.user.upsert({
      where: { walletAddress: body.bidder },
      update: { 
        totalBids: { increment: 1 }
      },
      create: { 
        walletAddress: body.bidder,
        totalBids: 1
      }
    });

    return NextResponse.json({
      ...bid,
      auctionId: bid.auctionId.toString()
    });
  } catch (error) {
    console.error('Failed to create bid:', error);
    return NextResponse.json(
      { error: 'Failed to create bid' },
      { status: 500 }
    );
  }
}