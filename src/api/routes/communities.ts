/**
 * Community management routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { db } from '../../database/index.js';
import { ValidationError } from '../../core/errors.js';

const router = express.Router();

/**
 * POST /api/v1/communities
 * Create a new community
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Community name is required');
    }

    const community = await db.createCommunity(name);

    res.status(201).json({
      success: true,
      data: community,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/communities
 * List all communities
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const communities = await db.listCommunities();

    res.json({
      success: true,
      data: communities,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
