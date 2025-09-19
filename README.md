# Shadow Protocol

A privacy-preserving auction platform built on Solana using Arcium's MPC. Shadow Protocol enables truly private sealed-bid auctions, Dutch auctions with hidden reserves, and batch settlement processing.


## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Node.js](https://nodejs.org/) >= 18.0.0
- [Rust](https://rustup.rs/) >= 1.70.0
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) >= 1.16.0
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) >= 0.29.0
- [Arcium CLI](https://docs.arcium.com/installation) >= 0.1.0
- [Docker](https://docs.docker.com/get-docker/) (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shadow-protocol/shadow.git
   cd shadow-protocol
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate Solana keypair** (if you don't have one)
   ```bash
   solana-keygen new
   ```

5. **Build all packages**
   ```bash
   bun run setup
   ```

### Development Workflow

1. **Start local Solana validator**
   ```bash
   solana-test-validator
   ```

2. **Deploy programs to localnet**
   ```bash
   bun run program:deploy
   ```

3. **Build confidential instructions**
   ```bash
   bun run confidential:build
   ```

4. **Start the frontend**
   ```bash
   bun run app:dev
   ```

5. **Visit the application**
   ```
   http://localhost:3000
   ```

## 🧪 Testing

### Run all tests
```bash
bun run test
```

### Test individual packages
```bash
# Test Solana programs
bun run program:test

# Test confidential instructions
bun run confidential:test

# Test client SDK
bun run --filter='@shadow-protocol/client' test
```

## 🚢 Deployment

### Deploy to Devnet

1. **Configure for devnet**
   ```bash
   solana config set --url devnet
   ```

2. **Airdrop SOL for deployment**
   ```bash
   solana airdrop 2
   ```

3. **Deploy programs**
   ```bash
   bun run program:deploy:devnet
   ```

4. **Deploy confidential instructions**
   ```bash
   bun run --filter='@shadow-protocol/confidential' deploy
   ```

5. **Update environment variables**
   ```bash
   # Update .env with deployed program IDs
   NEXT_PUBLIC_SHADOW_PROTOCOL_PROGRAM_ID=<your-program-id>
   ```

6. **Build and deploy frontend**
   ```bash
   bun run app:build
   # Deploy to your preferred hosting platform
   ```

## 📖 Usage Examples

### Creating a Sealed-Bid Auction

```typescript
import { ShadowProtocolClient } from '@shadow-protocol/client';
import { PublicKey } from '@solana/web3.js';

// Initialize client
const client = new ShadowProtocolClient({
  rpcUrl: 'https://api.devnet.solana.com',
  arciumClusterPubkey: new PublicKey('your-cluster-pubkey'),
  wallet: yourWallet,
});

// Create auction
const result = await client.createSealedAuction({
  assetMint: new PublicKey('asset-mint-address'),
  duration: 3600, // 1 hour
  minimumBid: 1000000, // 1 SOL in lamports
  reservePrice: 5000000, // 5 SOL in lamports
});

console.log('Auction created:', result.auctionId);
```

### Submitting an Encrypted Bid

```typescript
// Submit bid (amount is encrypted client-side)
const bidResult = await client.submitEncryptedBid({
  auctionId: 123,
  bidAmount: 7000000, // 7 SOL in lamports
});

console.log('Bid submitted:', bidResult.signature);
```

### Settling an Auction

```typescript
// Settle auction (triggers MPC computation)
const settlement = await client.settleAuction(123);
console.log('Settlement:', settlement.signature);

// Wait for MPC computation to complete
const finalResult = await client.waitForComputation(settlement.signature);
console.log('Final result:', finalResult);
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **Website**: [shadowprotocol.fun](https://shadowprotocol.fun)
- **Documentation**: [shadowprotocol.fun/docs](https://shadowprotocol.fun/docs)

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Not financial advice.