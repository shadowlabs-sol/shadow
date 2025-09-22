# Shadow Protocol SDK

A TypeScript SDK for interacting with Shadow Protocol - a privacy-preserving auction platform built on Solana using Arcium's MPC technology.

## Features

- **Sealed-bid auctions** with encrypted bids and reserve prices
- **Dutch auctions** with hidden reserves
- **Batch settlement** processing via MPC computation
- **Privacy-preserving** encryption using Arcium's client-side encryption
- **Type-safe** TypeScript interfaces
- **Event subscriptions** for real-time updates

## Installation

```bash
npm install @shadow-protocol/client
# or
yarn add @shadow-protocol/client
# or
bun add @shadow-protocol/client
```

## Quick Start

```typescript
import { ShadowProtocolClient } from '@shadow-protocol/client';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';

const connection = new Connection('https://api.devnet.solana.com');
const client = new ShadowProtocolClient({
  rpcUrl: 'https://api.devnet.solana.com',
  arciumClusterPubkey: 'your-cluster-pubkey',
  wallet: yourWallet,
  commitment: 'confirmed'
});

// Create a sealed-bid auction
const auction = await client.createSealedAuction({
  assetMint: new PublicKey('asset-mint-address'),
  duration: 3600,
  minimumBid: 1000000,
  reservePrice: 5000000,
});

// Submit an encrypted bid
const bid = await client.submitEncryptedBid({
  auctionId: auction.auctionId,
  amount: 7000000,
});

// Settle the auction
const settlement = await client.settleAuction(auction.auctionId);
```

## Configuration

### ShadowProtocolConfig

```typescript
interface ShadowProtocolConfig {
  rpcUrl: string;
  programId?: string;
  clusterOffset?: number;
  callbackUrl?: string;
  commitment?: Commitment;
  wallet?: Wallet;
  arciumClusterPubkey?: string;
  mxePublicKey?: Uint8Array;
}
```

### Environment Variables

```bash
# Required
SHADOW_PROTOCOL_PROGRAM_ID=your_program_id
ARCIUM_CLUSTER_PUBKEY=your_cluster_pubkey

# Optional
SOLANA_RPC_URL=https://api.devnet.solana.com
MXE_PUBLIC_KEY=your_mxe_public_key
CLUSTER_OFFSET=0
```

## API Reference

### Core Methods

#### `createSealedAuction(params)`
Creates a new sealed-bid auction with encrypted reserve price.

**Parameters:**
- `assetMint: PublicKey` - Token mint address for the auctioned asset
- `duration: number` - Auction duration in seconds
- `minimumBid: number` - Minimum bid amount in lamports
- `reservePrice?: number` - Hidden reserve price in lamports

**Returns:**
```typescript
{
  signature: TransactionSignature;
  auctionId: number;
  auctionPubkey: PublicKey;
}
```

#### `createDutchAuction(params)`
Creates a Dutch auction with decreasing price and hidden reserve.

**Parameters:**
- `assetMint: PublicKey` - Token mint address
- `duration: number` - Auction duration in seconds  
- `startingPrice: number` - Starting price in lamports
- `priceDecreaseRate: number` - Price decrease per second
- `reservePrice?: number` - Hidden reserve price

#### `submitEncryptedBid(params)`
Submits an encrypted bid to a sealed auction.

**Parameters:**
- `auctionId: string` - Auction identifier
- `amount: number` - Bid amount in lamports

**Returns:**
```typescript
{
  signature: TransactionSignature;
  bidPubkey: PublicKey;
  computationSignature?: TransactionSignature;
}
```

#### `submitDutchBid(params)`
Submits a bid to a Dutch auction at current price.

#### `settleAuction(auctionId)`
Triggers auction settlement via MPC computation.

#### `batchSettle(auctionIds)`
Settles multiple auctions in a single batch operation.

### Query Methods

#### `getAuction(auctionId): Promise<AuctionData | null>`
Retrieves auction data by ID.

#### `getAuctionBids(auctionId): Promise<BidData[]>`
Gets all bids for a specific auction.

#### `getUserBids(userPubkey): Promise<BidData[]>`
Gets all bids submitted by a user.

#### `getActiveAuctions(): Promise<AuctionData[]>`
Returns all currently active auctions.

#### `getAuctionsByType(type): Promise<AuctionData[]>`
Filters auctions by type (Sealed, Dutch, etc.).

#### `getAuctionsByStatus(status): Promise<AuctionData[]>`
Filters auctions by status (Active, Ended, Settled).

### Utility Methods

#### `getCurrentDutchPrice(auctionId): Promise<number>`
Calculates current price for a Dutch auction.

#### `isAuctionEnded(auctionId): Promise<boolean>`
Checks if an auction has ended.

#### `waitForComputation(txSignature, maxWaitTime?): Promise<TransactionSignature>`
Waits for MPC computation to complete.

### Event Subscriptions

#### `subscribeToAuctionEvents(callback, auctionId?)`
Subscribes to auction lifecycle events.

#### `subscribeToBidEvents(callback, auctionId?)`
Subscribes to bid submission events.

#### `subscribeToSettlementEvents(callback)`
Subscribes to settlement completion events.

## Types

### AuctionType
```typescript
enum AuctionType {
  Sealed = 'Sealed',
  Dutch = 'Dutch',
  Reserve = 'Reserve'
}
```

### AuctionStatus
```typescript
enum AuctionStatus {
  Active = 'Active',
  Ended = 'Ended',
  Settled = 'Settled',
  Cancelled = 'Cancelled'
}
```

### AuctionData
```typescript
interface AuctionData {
  id: number;
  creator: PublicKey;
  assetMint: PublicKey;
  auctionType: AuctionType;
  status: AuctionStatus;
  startTime: number;
  endTime: number;
  minimumBid: number;
  currentPrice: number;
  startingPrice?: number;
  priceDecreaseRate?: number;
  totalBids: number;
  highestBid?: number;
  winner?: PublicKey;
}
```

### BidData
```typescript
interface BidData {
  bidder: PublicKey;
  auctionId: number;
  amount: number;
  timestamp: number;
  isEncrypted: boolean;
  nonce?: Uint8Array;
  publicKey?: Uint8Array;
}
```

## Examples

### Complete Sealed Auction Flow

```typescript
import { ShadowProtocolClient, AuctionStatus } from '@shadow-protocol/client';

async function runSealedAuction() {
  const client = new ShadowProtocolClient({
    rpcUrl: process.env.SOLANA_RPC_URL!,
    arciumClusterPubkey: process.env.ARCIUM_CLUSTER_PUBKEY!,
    wallet: yourWallet
  });

  // 1. Create auction
  const auction = await client.createSealedAuction({
    assetMint: new PublicKey('your-asset-mint'),
    duration: 3600, // 1 hour
    minimumBid: 1_000_000, // 1 SOL
    reservePrice: 5_000_000 // 5 SOL (hidden)
  });

  console.log(`Created auction ${auction.auctionId}`);

  // 2. Submit bids from multiple users
  const bids = await Promise.all([
    client.submitEncryptedBid({
      auctionId: auction.auctionId,
      amount: 6_000_000 // 6 SOL
    }),
    client.submitEncryptedBid({
      auctionId: auction.auctionId, 
      amount: 7_500_000 // 7.5 SOL
    })
  ]);

  console.log(`Submitted ${bids.length} bids`);

  // 3. Wait for auction to end
  while (!(await client.isAuctionEnded(auction.auctionId))) {
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // 4. Settle auction
  const settlement = await client.settleAuction(auction.auctionId);
  console.log(`Settlement: ${settlement.signature}`);

  // 5. Wait for MPC computation
  await client.waitForComputation(settlement.signature);

  // 6. Check final results
  const finalAuction = await client.getAuction(auction.auctionId);
  console.log(`Winner: ${finalAuction?.winner}`);
  console.log(`Final price: ${finalAuction?.currentPrice}`);
}
```

### Dutch Auction with Real-time Updates

```typescript
async function runDutchAuction() {
  const client = new ShadowProtocolClient(config);

  // Create Dutch auction
  const auction = await client.createDutchAuction({
    assetMint: new PublicKey('your-asset-mint'),
    duration: 1800,
    startingPrice: 10_000_000,
    priceDecreaseRate: 100_000,
    reservePrice: 3_000_000
  });

  // Subscribe to price updates
  const unsubscribe = client.subscribeToAuctionEvents((event) => {
    console.log('Auction event:', event);
  }, auction.auctionId);

  // Monitor price and bid when acceptable
  const checkPrice = async () => {
    const currentPrice = await client.getCurrentDutchPrice(auction.auctionId);
    console.log(`Current price: ${currentPrice / 1_000_000} SOL`);
    
    if (currentPrice <= 6_000_000) { // 6 SOL target
      const bid = await client.submitDutchBid({
        auctionId: auction.auctionId,
        amount: currentPrice
      });
      
      if (bid.accepted) {
        console.log('Bid accepted!');
        unsubscribe();
      }
    }
  };

  const interval = setInterval(checkPrice, 1000);
  
  setTimeout(() => {
    clearInterval(interval);
    unsubscribe();
  }, 1800 * 1000);
}
```

### Batch Settlement

```typescript
async function batchSettle() {
  const client = new ShadowProtocolClient(config);
  
  // Get all ended auctions
  const endedAuctions = await client.getAuctionsByStatus(AuctionStatus.Ended);
  const auctionIds = endedAuctions.map(auction => auction.id);
  
  if (auctionIds.length > 0) {
    // Settle all at once
    const batch = await client.batchSettle(auctionIds);
    console.log(`Batch settlement: ${batch.signature}`);
    
    // Wait for all computations
    await client.waitForComputation(batch.signature, 120000); // 2 minute timeout
    
    console.log(`Settled ${auctionIds.length} auctions`);
  }
}
```

### Error Handling

```typescript
import { ShadowProtocolError, ErrorCode } from '@shadow-protocol/client';

async function handleErrors() {
  try {
    const auction = await client.createSealedAuction({
      // invalid parameters
    });
  } catch (error) {
    if (error instanceof ShadowProtocolError) {
      switch (error.code) {
        case ErrorCode.INSUFFICIENT_FUNDS:
          console.log('Not enough SOL for transaction');
          break;
        case ErrorCode.AUCTION_ENDED:
          console.log('Auction has already ended');
          break;
        case ErrorCode.BID_TOO_LOW:
          console.log('Bid below minimum amount');
          break;
        default:
          console.log(`Protocol error: ${error.message}`);
      }
    } else {
      console.log(`Unexpected error: ${error.message}`);
    }
  }
}
```

## Testing

```bash
bun test

bun test --coverage

bun test src/auction/ShadowClient.test.ts
```

## Development

```bash
bun install

bun run build

bun run dev

bun run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `bun run lint` and `bun test`
6. Submit a pull request

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Links

- [Shadow Protocol Documentation](https://shadowprotocol.fun/docs)
- [Arcium MPC Documentation](https://docs.arcium.com)
- [Solana Web3.js Guide](https://solana-labs.github.io/solana-web3.js/)
- [Anchor Framework](https://www.anchor-lang.com/)