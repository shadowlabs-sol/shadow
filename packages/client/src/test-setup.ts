// Jest setup file for Shadow Protocol SDK tests

// Mock Solana connection for tests
export const mockConnection = {
  getAccountInfo: jest.fn(),
  sendTransaction: jest.fn(),
  getLatestBlockhash: jest.fn(),
  confirmTransaction: jest.fn(),
};

// Mock wallet for tests
export const mockWallet = {
  publicKey: 'mock-public-key',
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);

// Console warnings and errors during tests
global.console = {
  ...console,
  // Uncomment to suppress logs during testing
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};