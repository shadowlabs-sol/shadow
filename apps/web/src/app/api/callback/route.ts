import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PublicKey, Connection } from '@solana/web3.js';
import { verify } from '@noble/ed25519';

const prisma = new PrismaClient();
const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');

/**
 * Arcium Callback Server
 * Receives computation results from MPC nodes when output is too large for on-chain callback
 */
export async function POST(request: NextRequest) {
  try {
    // Parse raw byte data according to Arcium protocol:
    // mempool_id|comp_def_offset|tx_sig|data_sig|pub_key|data
    const buffer = Buffer.from(await request.arrayBuffer());
    
    let offset = 0;
    
    // Parse mempool_id (u16)
    const mempoolId = buffer.readUInt16LE(offset);
    offset += 2;
    
    // Parse comp_def_offset (u32)
    const compDefOffset = buffer.readUInt32LE(offset);
    offset += 4;
    
    // Parse tx_sig (64 bytes)
    const txSig = buffer.subarray(offset, offset + 64);
    offset += 64;
    
    // Parse data_sig (64 bytes)
    const dataSig = buffer.subarray(offset, offset + 64);
    offset += 64;
    
    // Parse pub_key (32 bytes)
    const pubKey = buffer.subarray(offset, offset + 32);
    offset += 32;
    
    // Parse data (remaining bytes)
    const data = buffer.subarray(offset);
    
    // Verify signature
    const isValidSignature = await verifySignature(data, dataSig, pubKey);
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Process based on computation type
    let processedData;
    switch (compDefOffset) {
      case 0x12345678: // COMP_DEF_OFFSET_SEALED_BID
        processedData = await processSealedBidResult(data);
        break;
      case 0x87654321: // COMP_DEF_OFFSET_DUTCH_AUCTION
        processedData = await processDutchAuctionResult(data);
        break;
      case 0xABCDEF01: // COMP_DEF_OFFSET_BATCH_SETTLEMENT
        processedData = await processBatchSettlementResult(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown computation type' },
          { status: 400 }
        );
    }
    
    // Store computation result
    await prisma.mXEComputation.create({
      data: {
        computationOffset: BigInt(compDefOffset),
        programId: 'ShadowProtocol11111111111111111111111111111',
        status: 'COMPLETED',
        inputData: buffer,
        outputData: data,
        completedAt: new Date(),
      }
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      mempoolId,
      compDefOffset,
      processedData
    });
    
  } catch (error) {
    console.error('Callback processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

async function verifySignature(
  data: Buffer,
  signature: Buffer,
  publicKey: Buffer
): Promise<boolean> {
  try {
    // Verify Ed25519 signature
    return await verify(signature, data, publicKey);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

async function processSealedBidResult(data: Buffer): Promise<any> {
  try {
    // Parse sealed bid auction result
    // Format: winner_id (16 bytes) | winning_amount (8 bytes) | met_reserve (1 byte)
    let offset = 0;
    
    const winnerId = data.subarray(offset, offset + 16);
    offset += 16;
    
    const winningAmount = data.readBigUInt64LE(offset);
    offset += 8;
    
    const metReserve = data.readUInt8(offset) === 1;
    
    // Find the auction and update it
    const auctionIdBytes = data.subarray(offset + 1, offset + 9);
    const auctionId = auctionIdBytes.readBigUInt64LE(0);
    
    const auction = await prisma.auction.findFirst({
      where: { auctionId }
    });
    
    if (auction) {
      // Update auction with winner
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: 'SETTLED',
          winner: new PublicKey(winnerId).toBase58(),
          winningAmount,
          settledAt: new Date()
        }
      });
      
      // Create settlement record
      await prisma.settlement.create({
        data: {
          auctionId,
          auctionDbId: auction.id,
          winner: new PublicKey(winnerId).toBase58(),
          winningAmount,
          settlementTime: new Date(),
          transactionHash: Buffer.from(data.subarray(0, 64)).toString('hex'),
          callbackData: data
        }
      });
      
      // Update winning bid
      await prisma.bid.updateMany({
        where: {
          auctionDbId: auction.id,
          bidder: new PublicKey(winnerId).toBase58()
        },
        data: {
          isWinner: true
        }
      });
    }
    
    return {
      auctionId: auctionId.toString(),
      winner: new PublicKey(winnerId).toBase58(),
      winningAmount: winningAmount.toString(),
      metReserve
    };
  } catch (error) {
    console.error('Failed to process sealed bid result:', error);
    throw error;
  }
}

async function processDutchAuctionResult(data: Buffer): Promise<any> {
  try {
    // Parse Dutch auction result
    let offset = 0;
    
    const auctionId = data.readBigUInt64LE(offset);
    offset += 8;
    
    const winnerId = data.subarray(offset, offset + 32);
    offset += 32;
    
    const finalPrice = data.readBigUInt64LE(offset);
    
    // Update auction
    const auction = await prisma.auction.findFirst({
      where: { auctionId }
    });
    
    if (auction) {
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: 'SETTLED',
          winner: new PublicKey(winnerId).toBase58(),
          winningAmount: finalPrice,
          settledAt: new Date()
        }
      });
    }
    
    return {
      auctionId: auctionId.toString(),
      winner: new PublicKey(winnerId).toBase58(),
      finalPrice: finalPrice.toString()
    };
  } catch (error) {
    console.error('Failed to process Dutch auction result:', error);
    throw error;
  }
}

async function processBatchSettlementResult(data: Buffer): Promise<any> {
  try {
    // Parse batch settlement results
    let offset = 0;
    const numAuctions = data.readUInt32LE(offset);
    offset += 4;
    
    const results = [];
    
    for (let i = 0; i < numAuctions; i++) {
      const auctionId = data.readBigUInt64LE(offset);
      offset += 8;
      
      const hasWinner = data.readUInt8(offset) === 1;
      offset += 1;
      
      if (hasWinner) {
        const winnerId = data.subarray(offset, offset + 32);
        offset += 32;
        
        const winningAmount = data.readBigUInt64LE(offset);
        offset += 8;
        
        results.push({
          auctionId: auctionId.toString(),
          winner: new PublicKey(winnerId).toBase58(),
          winningAmount: winningAmount.toString()
        });
        
        // Update each auction
        const auction = await prisma.auction.findFirst({
          where: { auctionId }
        });
        
        if (auction) {
          await prisma.auction.update({
            where: { id: auction.id },
            data: {
              status: 'SETTLED',
              winner: new PublicKey(winnerId).toBase58(),
              winningAmount,
              settledAt: new Date()
            }
          });
        }
      } else {
        results.push({
          auctionId: auctionId.toString(),
          winner: null,
          winningAmount: '0'
        });
      }
    }
    
    return {
      numAuctions,
      results
    };
  } catch (error) {
    console.error('Failed to process batch settlement result:', error);
    throw error;
  }
}