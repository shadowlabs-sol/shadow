import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('shadow-session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            avatar: true,
            verified: true,
            email: true,
            bio: true,
            totalBids: true,
            auctionsWon: true,
            auctionsCreated: true,
            totalVolume: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      // Delete expired session
      if (session) {
        await prisma.session.delete({
          where: { id: session.id },
        });
      }
      
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Convert BigInt fields to numbers for JSON serialization
    const userWithSerializableData = {
      ...session.user,
      totalBids: session.user.totalBids ? Number(session.user.totalBids) : 0,
      auctionsWon: session.user.auctionsWon ? Number(session.user.auctionsWon) : 0,
      auctionsCreated: session.user.auctionsCreated ? Number(session.user.auctionsCreated) : 0,
      totalVolume: session.user.totalVolume ? Number(session.user.totalVolume) : 0,
    };

    return NextResponse.json({
      user: userWithSerializableData,
      session: {
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
}