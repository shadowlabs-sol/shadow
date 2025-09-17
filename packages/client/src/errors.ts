export class ShadowProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShadowProtocolError';
  }
}

export class AuctionError extends ShadowProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'AuctionError';
  }
}

export class BidError extends ShadowProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'BidError';
  }
}

export class EncryptionError extends ShadowProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class ValidationError extends ShadowProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}