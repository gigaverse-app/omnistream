/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../database/index.js';
import { AuthenticationError } from '../../core/errors.js';
import { Community } from '../../core/interfaces.js';

// Extend Express Request type to include community
declare global {
  namespace Express {
    interface Request {
      community?: Community;
    }
  }
}

/**
 * Middleware to authenticate requests using API key
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    const community = await db.getCommunityByApiKey(apiKey);
    req.community = community;

    next();
  } catch (error) {
    next(error);
  }
}
