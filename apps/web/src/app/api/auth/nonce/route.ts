import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString('hex');

    // Create or update user with nonce
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { nonce },
      create: {
        walletAddress,
        nonce,
      },
    });

    return NextResponse.json({
      nonce,
      message: `Sign this message to authenticate with Shadow Protocol:\n\nNonce: ${nonce}\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`,
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}