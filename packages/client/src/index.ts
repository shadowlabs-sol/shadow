// Core exports
export * from './auction/ShadowClient';
export * from './auction/AuctionManager';
export * from './auction/BidManager';

// Crypto utilities
export * from './crypto/encryption';
export * from './crypto/keys';

// Types
export * from './types/auction';
export * from './types/bid';
export * from './types/settlement';
export * from './types/config';

// Utilities
export * from './utils/constants';
export * from './utils/helpers';
export * from './utils/validation';

// Main client class
export { ShadowProtocolClient } from './ShadowProtocolClient';

// Error classes
export * from './errors';