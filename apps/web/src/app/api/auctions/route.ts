import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const creator = searchParams.get('creator');

    const where: any = {};
    
    if (status) {
      where.status = status.toUpperCase();
    }
    
    if (type) {
      where.type = type.toUpperCase();
    }
    
    if (creator) {
      where.creator = creator;
    }

    const auctions = await prisma.auction.findMany({
      where,
      include: {
        bids: {
          select: {
            id: true,
            bidder: true,
            timestamp: true,
            isWinner: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response to handle BigInt serialization
    const formattedAuctions = auctions.map((auction: any) => ({
      ...auction,
      auctionId: auction.auctionId.toString(),
      minimumBid: auction.minimumBid.toString(),
      currentPrice: auction.currentPrice?.toString(),
      priceDecreaseRate: auction.priceDecreaseRate?.toString(),
      startingPrice: auction.startingPrice?.toString(),
      winningAmount: auction.winningAmount?.toString(),
      bidCount: auction.bidCount || 0,
      reservePriceEncrypted: auction.reservePriceEncrypted ? Array.from(auction.reservePriceEncrypted) : null
    }));

    return NextResponse.json(formattedAuctions);
  } catch (error) {
    console.error('Failed to fetch auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const auctionId = searchParams.get('auctionId');
    
    if (!auctionId) {
      return NextResponse.json(
        { error: 'Auction ID is required' },
        { status: 400 }
      );
    }

    // Delete related bids first (due to foreign key constraints)
    await prisma.bid.deleteMany({
      where: {
        auctionId: BigInt(auctionId)
      }
    });

    // Delete the auction
    const deletedAuction = await prisma.auction.delete({
      where: {
        auctionId: BigInt(auctionId)
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Auction deleted successfully',
      auctionId: deletedAuction.auctionId.toString()
    });
  } catch (error) {
    console.error('Failed to delete auction:', error);
    return NextResponse.json(
      { error: 'Failed to delete auction' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const auction = await prisma.auction.create({
      data: {
        auctionId: BigInt(body.auctionId),
        title: body.title || null,
        description: body.description || null,
        creator: body.creator,
        assetMint: body.assetMint,
        assetVault: body.assetVault || body.creator,
        type: body.type.toUpperCase(),
        status: 'ACTIVE',
        startTime: new Date(body.startTime * 1000),
        endTime: new Date(body.endTime * 1000),
        minimumBid: BigInt(body.minimumBid),
        reservePriceEncrypted: body.reservePriceEncrypted ? Buffer.from(body.reservePriceEncrypted) : null,
        reservePriceNonce: body.reservePriceNonce?.toString(),
        currentPrice: body.currentPrice ? BigInt(body.currentPrice) : null,
        priceDecreaseRate: body.priceDecreaseRate ? BigInt(body.priceDecreaseRate) : null,
        startingPrice: body.startingPrice ? BigInt(body.startingPrice) : null,
        transactionHash: body.transactionHash
      }
    });

    // Update user stats
    await prisma.user.upsert({
      where: { walletAddress: body.creator },
      update: {},
      create: { walletAddress: body.creator }
    });

    return NextResponse.json({
      ...auction,
      auctionId: auction.auctionId.toString(),
      minimumBid: auction.minimumBid.toString(),
      currentPrice: auction.currentPrice?.toString(),
      priceDecreaseRate: auction.priceDecreaseRate?.toString(),
      startingPrice: auction.startingPrice?.toString(),
      winningAmount: auction.winningAmount?.toString(),
      reservePriceEncrypted: auction.reservePriceEncrypted ? Array.from(auction.reservePriceEncrypted) : null
    });
  } catch (error) {
    console.error('Failed to create auction:', error);
    return NextResponse.json(
      { error: 'Failed to create auction' },
      { status: 500 }
    );
  }
}