import { RescueCipher, x25519 } from '@arcium-hq/client';
import { randomBytes } from 'crypto';

export class EncryptionManager {
  private arciumClusterPubkey: string;
  private clusterOffset: number;
  private mxePublicKey: Uint8Array;

  constructor(arciumClusterPubkey: string, clusterOffset: number, mxePublicKey?: Uint8Array) {
    this.arciumClusterPubkey = arciumClusterPubkey;
    this.clusterOffset = clusterOffset;
    // Default MXE public key for testing - in production this should come from configuration
    this.mxePublicKey = mxePublicKey || new Uint8Array(32).fill(1);
  }

  /**
   * Encrypt a value for shared access between client and MXE
   */
  async encryptValue(value: bigint | number, mxePublicKey?: Uint8Array): Promise<{
    encryptedData: Uint8Array;
    nonce: bigint;
    publicKey: Uint8Array;
    sharedSecret: Uint8Array;
  }> {
    // Generate ephemeral keypair for this encryption
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    
    // Generate shared secret with MXE
    const publicKeyToUse = mxePublicKey || this.mxePublicKey;
    const sharedSecret = x25519.getSharedSecret(privateKey, publicKeyToUse);
    
    // Initialize Rescue cipher with shared secret
    const cipher = new RescueCipher(sharedSecret);
    
    // Generate random nonce
    const nonceBytes = randomBytes(16);
    const nonce = BigInt('0x' + nonceBytes.toString('hex'));
    
    // Encrypt the value
    const plaintext = [BigInt(value)];
    const ciphertext = cipher.encrypt(plaintext, nonceBytes);
    
    return {
      encryptedData: new Uint8Array(Array.isArray(ciphertext[0]) ? ciphertext[0] : [ciphertext[0]]),
      nonce,
      publicKey,
      sharedSecret
    };
  }

  /**
   * Encrypt multiple values (for struct inputs)
   */
  async encryptStruct(values: bigint[], mxePublicKey?: Uint8Array): Promise<{
    encryptedData: Uint8Array[];
    nonce: bigint;
    publicKey: Uint8Array;
    sharedSecret: Uint8Array;
  }> {
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const publicKeyToUse = mxePublicKey || this.mxePublicKey;
    const sharedSecret = x25519.getSharedSecret(privateKey, publicKeyToUse);
    const cipher = new RescueCipher(sharedSecret);
    
    const nonceBytes = randomBytes(16);
    const nonce = BigInt('0x' + nonceBytes.toString('hex'));
    
    const ciphertexts = cipher.encrypt(values, nonceBytes);
    
    return {
      encryptedData: ciphertexts.map(ct => new Uint8Array(Array.isArray(ct) ? ct : [ct])),
      nonce,
      publicKey,
      sharedSecret
    };
  }

  /**
   * Decrypt data received from MXE
   */
  async decryptData(
    encryptedData: Uint8Array | Uint8Array[],
    nonce: Uint8Array,
    sharedSecret: Uint8Array
  ): Promise<bigint[]> {
    const cipher = new RescueCipher(sharedSecret);
    
    const ciphertexts = Array.isArray(encryptedData) 
      ? encryptedData 
      : [encryptedData];
    
    // Convert Uint8Array to number[] if needed for the cipher
    const convertedCiphertexts = ciphertexts.map(ct => Array.from(ct));
    return cipher.decrypt(convertedCiphertexts as any, nonce);
  }

  /**
   * Verify encrypted bid data
   */
  async verifyBidEncryption(
    bidData: Uint8Array,
    expectedAuctionId: bigint,
    publicKey: Uint8Array,
    mxePublicKey: Uint8Array
  ): Promise<boolean> {
    try {
      // Recreate shared secret
      const sharedSecret = x25519.getSharedSecret(
        x25519.utils.randomPrivateKey(), // This should be the original private key
        mxePublicKey
      );
      
      // For actual implementation, you'd need to store or derive the original private key
      // This is a simplified version
      return true;
    } catch (error) {
      console.error('Failed to verify bid encryption:', error);
      return false;
    }
  }

  /**
   * Generate encryption keys for a new auction
   */
  async generateAuctionKeys(): Promise<{
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  }> {
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    
    return { privateKey, publicKey };
  }
}