import { Keypair, PublicKey } from '@solana/web3.js';
import * as x25519 from '@stablelib/x25519';
import { sha256 } from '@noble/hashes/sha256';

export class KeyManager {
  private x25519PrivateKey: Uint8Array;
  public x25519PublicKey: Uint8Array;
  
  constructor(seed?: Uint8Array) {
    const keyPair = x25519.generateKeyPair();
    this.x25519PrivateKey = keyPair.secretKey;
    this.x25519PublicKey = keyPair.publicKey;
  }
  
  static fromSolanaKeypair(keypair: Keypair): KeyManager {
    const seed = sha256(keypair.secretKey);
    const manager = new KeyManager();
    const keyPair = x25519.generateKeyPairFromSeed(seed);
    manager.x25519PrivateKey = keyPair.secretKey;
    manager.x25519PublicKey = keyPair.publicKey;
    return manager;
  }
  
  getSharedSecret(otherPublicKey: Uint8Array): Uint8Array {
    return x25519.sharedKey(this.x25519PrivateKey, otherPublicKey);
  }
  
  getPublicKey(): Uint8Array {
    return this.x25519PublicKey;
  }
}