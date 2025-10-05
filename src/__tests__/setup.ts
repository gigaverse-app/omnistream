/**
 * Global test setup - runs before each test
 */

import { db } from '../database/index.js';

// Suppress console output during tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for actual test failures
};

beforeEach(() => {
  // Clear database before each test to ensure isolation
  db.clearAll();
});
