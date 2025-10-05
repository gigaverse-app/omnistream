/**
 * Global test setup - runs before each test
 */

import { db } from '../database/index.js';

// Suppress console output during tests to reduce noise
// But keep console.error to catch actual errors
const originalError = console.error;
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: (...args: any[]) => {
    // Filter out expected test errors
    const msg = args[0];
    if (typeof msg === 'string' && msg.includes('"level":"error"')) {
      // This is from our logger, suppress it in tests
      return;
    }
    originalError(...args);
  },
};

beforeEach(() => {
  // Clear database before each test to ensure isolation
  db.clearAll();
});

afterAll(async () => {
  // Give time for all async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 100));
});
