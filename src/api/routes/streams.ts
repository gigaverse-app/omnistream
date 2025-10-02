/**
 * Stream management routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { streamService } from '../../core/services/stream-service.js';
import { ValidationError } from '../../core/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All stream routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/streams
 * Create a new multi-platform stream
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communityId = req.community!.id;
    const { title, description, scheduledStartTime, rtmpUrl, rtmpKey, platforms } = req.body;

    if (!title || typeof title !== 'string') {
      throw new ValidationError('Title is required');
    }

    if (!rtmpUrl || typeof rtmpUrl !== 'string') {
      throw new ValidationError('RTMP URL is required');
    }

    if (!rtmpKey || typeof rtmpKey !== 'string') {
      throw new ValidationError('RTMP key is required');
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw new ValidationError('At least one platform must be specified');
    }

    const result = await streamService.createStream(communityId, {
      title,
      description,
      scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
      rtmpUrl,
      rtmpKey,
      platforms,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/streams
 * List all streams for the authenticated community
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communityId = req.community!.id;
    const streams = await streamService.listStreams(communityId);

    res.json({
      success: true,
      data: streams,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/streams/:streamId
 * Get stream status
 */
router.get('/:streamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communityId = req.community!.id;
    const { streamId } = req.params;

    const result = await streamService.getStreamStatus(streamId, communityId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/streams/:streamId/start
 * Start a stream on all platforms
 */
router.post('/:streamId/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communityId = req.community!.id;
    const { streamId } = req.params;

    const platformStreams = await streamService.startStream(streamId, communityId);

    res.json({
      success: true,
      data: platformStreams,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/streams/:streamId/stop
 * Stop a stream on all platforms
 */
router.post('/:streamId/stop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communityId = req.community!.id;
    const { streamId } = req.params;

    const platformStreams = await streamService.stopStream(streamId, communityId);

    res.json({
      success: true,
      data: platformStreams,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/streams/:streamId
 * Delete a stream
 */
router.delete('/:streamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const communityId = req.community!.id;
    const { streamId } = req.params;

    await streamService.deleteStream(streamId, communityId);

    res.json({
      success: true,
      data: {
        message: 'Stream deleted successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
