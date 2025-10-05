/**
 * Unit tests for authentication middleware
 */

import { NextFunction, Request, Response } from 'express';
import { authenticate } from '../../../api/middleware/auth.js';
import { db } from '../../../database/index.js';
import { AuthenticationError } from '../../../core/errors.js';

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let testCommunity: any;

  beforeEach(async () => {
    testCommunity = await db.createCommunity('Test Community');

    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  it('should authenticate with valid API key', async () => {
    req.headers = { 'x-api-key': testCommunity.apiKey };

    await authenticate(req as Request, res as Response, next);

    expect(req.community).toBeDefined();
    expect(req.community!.id).toBe(testCommunity.id);
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject request without API key', async () => {
    req.headers = {};

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect(req.community).toBeUndefined();
  });

  it('should reject request with invalid API key', async () => {
    req.headers = { 'x-api-key': 'invalid-key' };

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(req.community).toBeUndefined();
  });

  it('should reject request with empty API key', async () => {
    req.headers = { 'x-api-key': '' };

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it('should handle API key with correct header', async () => {
    req.headers = { 'x-api-key': testCommunity.apiKey };

    await authenticate(req as Request, res as Response, next);

    expect(req.community).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should attach full community object to request', async () => {
    req.headers = { 'x-api-key': testCommunity.apiKey };

    await authenticate(req as Request, res as Response, next);

    expect(req.community).toEqual(
      expect.objectContaining({
        id: testCommunity.id,
        name: testCommunity.name,
        apiKey: testCommunity.apiKey,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
  });
});
