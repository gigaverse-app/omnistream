/**
 * Global test setup - runs before each test
 */

import { db } from '../database/index.js';

beforeEach(() => {
  // Clear database before each test to ensure isolation
  db.clearAll();
});
