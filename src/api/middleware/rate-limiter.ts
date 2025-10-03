/**
 * Rate limiting middleware
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../../core/errors.js';
import { config } from '../../utils/config.js';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitStore> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every minute
    // Only start interval in non-test environment
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now > record.resetTime) {
      // New window
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.store.get(identifier);
    if (!record) {
      return 0;
    }
    return Math.max(0, record.resetTime - Date.now());
  }
}

const rateLimiter = new RateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests
);

export function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use API key or IP address as identifier
  const identifier = (req.headers['x-api-key'] as string) || req.ip || 'unknown';

  if (!rateLimiter.check(identifier)) {
    const remainingMs = rateLimiter.getRemainingTime(identifier);
    const remainingSec = Math.ceil(remainingMs / 1000);

    res.setHeader('Retry-After', remainingSec.toString());
    next(
      new RateLimitError(
        `Rate limit exceeded. Try again in ${remainingSec} seconds.`
      )
    );
    return;
  }

  next();
}
