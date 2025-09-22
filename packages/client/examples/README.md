# Shadow Protocol SDK Examples

This directory contains comprehensive examples demonstrating how to use the Shadow Protocol SDK.

## Prerequisites

Before running the examples, make sure you have:

1. **Environment Variables Set**:
   ```bash
   export SOLANA_RPC_URL="https://api.devnet.solana.com"
   export ARCIUM_CLUSTER_PUBKEY="your_cluster_pubkey"
   export SHADOW_PROTOCOL_PROGRAM_ID="your_program_id"
   ```

2. **Dependencies Installed**:
   ```bash
   cd packages/client
   bun install
   ```

3. **Built the SDK**:
   ```bash
   bun run build
   ```

## Examples

### 1. Basic Auction (`basic-auction.ts`)

Demonstrates the fundamental auction flow:
- Creating a sealed-bid auction
- Submitting encrypted bids
- Settling the auction
- Retrieving results

**Run:**
```bash
bun run examples/basic-auction.ts
```

**What it does:**
- Creates a 1-hour sealed auction for wrapped SOL
- Submits two encrypted bids (6 SOL and 7.5 SOL)
- Shows auction status and bid information
- Settles the auction and displays winner

### 2. Dutch Auction (`dutch-auction.ts`)

Shows Dutch auction mechanics:
- Creating an auction with decreasing price
- Real-time price monitoring
- Automatic bidding when target price is reached
- Event subscriptions

**Run:**
```bash
bun run examples/dutch-auction.ts
```

**Features:**
- Starts at 10 SOL, decreases by 0.1 SOL/second
- Monitors price and bids when it hits 6 SOL
- Hidden reserve price of 3 SOL
- Real-time event notifications

### 3. Batch Operations (`batch-operations.ts`)

Demonstrates advanced batch operations:
- Creating multiple auctions simultaneously
- Submitting multiple bids
- Batch settlement processing
- Analytics and reporting

**Run:**
```bash
bun run examples/batch-operations.ts
```

**Showcases:**
- Bulk auction creation
- Automated bid submission
- Batch settlement for efficiency
- Platform analytics and user summaries

## Configuration

### Environment Setup

Create a `.env` file in the client package root:

```bash
# Required
SOLANA_RPC_URL=https://api.devnet.solana.com
ARCIUM_CLUSTER_PUBKEY=your_cluster_pubkey_here
SHADOW_PROTOCOL_PROGRAM_ID=your_program_id_here

# Optional
MXE_PUBLIC_KEY=your_mxe_public_key
CLUSTER_OFFSET=0
```

### Wallet Setup

The examples use randomly generated keypairs for demonstration. In production:

```typescript
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

// Load from file
const keypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync('path/to/keypair.json', 'utf8')))
);

// Or use a wallet adapter
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
const wallet = new PhantomWalletAdapter();
```

## Running Examples

### Method 1: Direct Execution
```bash
cd packages/client
bun run examples/basic-auction.ts
```

### Method 2: Via Package Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "example:basic": "tsx examples/basic-auction.ts",
    "example:dutch": "tsx examples/dutch-auction.ts", 
    "example:batch": "tsx examples/batch-operations.ts"
  }
}
```

Then run:
```bash
bun run example:basic
```

### Method 3: Programmatic Usage
```typescript
import { basicAuctionExample } from './examples/basic-auction';
import { dutchAuctionExample } from './examples/dutch-auction';
import { batchOperationsExample } from './examples/batch-operations';

async function runAllExamples() {
  await basicAuctionExample();
  await dutchAuctionExample(); 
  await batchOperationsExample();
}
```

## Example Output

### Basic Auction Example
```
Creating sealed auction...
✅ Auction created!
   Auction ID: 1
   Transaction: 5KJp...8xYz
   Auction Account: 9WzD...4mNp

Submitting bids...
✅ Bid 1 submitted: 3FkL...9sVx
✅ Bid 2 submitted: 7HjM...2qWe

📊 Auction Status:
   Status: Active
   Total Bids: 2
   End Time: 2024-01-15T15:30:00.000Z

🔨 Settling auction...
✅ Settlement initiated: 8NpQ...5tRs

🏆 Final Results:
   Winner: 7HjM...2qWe
   Final Price: 7.5 SOL
   Status: Settled
```

### Dutch Auction Example
```
🔥 Creating Dutch auction...
✅ Dutch auction created!
   Auction ID: 2
   Starting Price: 10 SOL
   Price decreases by 0.1 SOL every second

📊 Monitoring price...
   Current price: 9.80 SOL
   Current price: 9.60 SOL
   Current price: 6.00 SOL

🎯 Target price reached! Submitting bid...
✅ Bid accepted! Transaction: 4KjL...9xYz
   Winning price: 6.00 SOL
```

## Error Handling

Examples include comprehensive error handling:

```typescript
try {
  const auction = await client.createSealedAuction(params);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('Need more SOL for transaction fees');
  } else if (error.code === 'INVALID_AUCTION_PARAMS') {
    console.log('Check auction parameters');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## Testing Examples

Run example tests:
```bash
# Test all examples
bun test examples/

# Test specific example
bun test examples/basic-auction.test.ts
```

## Troubleshooting

### Common Issues

1. **"Cluster not found" error**
   - Verify `ARCIUM_CLUSTER_PUBKEY` is correct
   - Ensure cluster is running and accessible

2. **"Insufficient funds" error**
   - Add SOL to your wallet: `solana airdrop 2`
   - Check balance: `solana balance`

3. **"Transaction failed" error**
   - Check Solana network status
   - Verify program deployment
   - Increase commitment level to 'finalized'

4. **"MPC computation timeout"**
   - Increase `waitForComputation` timeout
   - Check Arcium network status
   - Verify MXE configuration

### Debug Mode

Enable detailed logging:
```typescript
const client = new ShadowProtocolClient({
  // ... config
  debug: true
});
```

Or set environment variable:
```bash
DEBUG=shadow-protocol:* bun run examples/basic-auction.ts
```

## Contributing

To add new examples:

1. Create a new `.ts` file in this directory
2. Follow the existing pattern with clear console output
3. Include comprehensive error handling
4. Add documentation to this README
5. Create corresponding tests

Example template:
```typescript
/**
 * Example description - What this example demonstrates
 */

import { ShadowProtocolClient } from '../src';
// ... imports

async function myExample() {
  console.log('🚀 Starting my example...');
  
  try {
    // Example implementation
    console.log('✅ Success!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  myExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { myExample };
```