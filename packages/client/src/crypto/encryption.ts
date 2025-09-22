import { RescueCipher, x25519 } from '@arcium-hq/client';
import { PublicKey, Connection } from '@solana/web3.js';

export class EncryptionManager {
  private mxeClusterAddress: PublicKey;
  private mxePublicKey: Uint8Array;
  private connection: Connection;

  constructor(mxeClusterAddress: string, connection: Connection, mxePublicKey?: Uint8Array) {
    this.mxeClusterAddress = new PublicKey(mxeClusterAddress);
    this.connection = connection;
    this.mxePublicKey = mxePublicKey || new Uint8Array(32);
  }

  async initializeMXE(): Promise<void> {
    const mxeAccount = await this.connection.getAccountInfo(this.mxeClusterAddress);
    if (!mxeAccount) {
      throw new Error('MXE cluster account not found');
    }
    this.mxePublicKey = mxeAccount.data.slice(0, 32);
  }

  async encryptValue(value: bigint | number, mxePublicKey?: Uint8Array): Promise<{
    encryptedData: Uint8Array;
    nonce: bigint;
    publicKey: Uint8Array;
    sharedSecret: Uint8Array;
  }> {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const publicKey = x25519.getPublicKey(privateKey);
    
    const publicKeyToUse = mxePublicKey || this.mxePublicKey;
    const sharedSecret = x25519.getSharedSecret(privateKey, publicKeyToUse);
    
    const cipher = new RescueCipher(sharedSecret);
    
    const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
    const nonce = BigInt('0x' + Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    const plaintext = [BigInt(value)];
    const ciphertext = cipher.encrypt(plaintext, nonceBytes);
    
    return {
      encryptedData: new Uint8Array(Array.isArray(ciphertext[0]) ? ciphertext[0] : [ciphertext[0]]),
      nonce,
      publicKey,
      sharedSecret
    };
  }

  async encryptStruct(values: bigint[], mxePublicKey?: Uint8Array): Promise<{
    encryptedData: Uint8Array[];
    nonce: bigint;
    publicKey: Uint8Array;
    sharedSecret: Uint8Array;
  }> {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const publicKey = x25519.getPublicKey(privateKey);
    const publicKeyToUse = mxePublicKey || this.mxePublicKey;
    const sharedSecret = x25519.getSharedSecret(privateKey, publicKeyToUse);
    const cipher = new RescueCipher(sharedSecret);
    
    const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
    const nonce = BigInt('0x' + Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    const ciphertexts = cipher.encrypt(values, nonceBytes);
    
    return {
      encryptedData: ciphertexts.map(ct => new Uint8Array(Array.isArray(ct) ? ct : [ct])),
      nonce,
      publicKey,
      sharedSecret
    };
  }

  async decryptData(
    encryptedData: Uint8Array | Uint8Array[],
    nonce: Uint8Array,
    sharedSecret: Uint8Array
  ): Promise<bigint[]> {
    const cipher = new RescueCipher(sharedSecret);
    
    const ciphertexts = Array.isArray(encryptedData) 
      ? encryptedData 
      : [encryptedData];
    
    const convertedCiphertexts = ciphertexts.map(ct => Array.from(ct));
    return cipher.decrypt(convertedCiphertexts as any, nonce);
  }

  async verifyBidEncryption(
    encryptedBid: Uint8Array,
    bidderPublicKey: Uint8Array,
    nonce: Uint8Array
  ): Promise<boolean> {
    try {
      const sharedSecret = x25519.getSharedSecret(bidderPublicKey, this.mxePublicKey);
      const cipher = new RescueCipher(sharedSecret);
      
      const convertedCiphertext = Array.from(encryptedBid);
      const decrypted = cipher.decrypt([convertedCiphertext], nonce);
      
      return decrypted.length > 0 && decrypted[0] > 0n;
    } catch (error) {
      return false;
    }
  }

  async generateAuctionKeys(): Promise<{
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  }> {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const publicKey = x25519.getPublicKey(privateKey);
    
    return { privateKey, publicKey };
  }
}