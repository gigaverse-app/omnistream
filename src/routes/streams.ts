import { Router, Request, Response } from 'express';
import { Platform } from '../types';
import { StreamService } from '../services';

export function createStreamRoutes(streamService: StreamService): Router {
  const router = Router();
  
  // Create a new stream
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { communityId, title, description, platforms, scheduledStartTime } = req.body;
      
      if (!communityId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_COMMUNITY_ID', message: 'communityId is required' }
        });
      }
      
      if (!title) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_TITLE', message: 'title is required' }
        });
      }
      
      if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PLATFORMS', message: 'At least one platform is required' }
        });
      }
      
      const stream = await streamService.createStream(communityId, {
        title,
        description,
        platforms: platforms as Platform[],
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined
      });
      
      res.status(201).json({
        success: true,
        data: stream
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'CREATE_FAILED', message: error.message }
      });
    }
  });
  
  // Get stream by ID
  router.get('/:streamId', async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      const stream = await streamService.getStream(streamId);
      
      if (!stream) {
        return res.status(404).json({
          success: false,
          error: { code: 'STREAM_NOT_FOUND', message: 'Stream not found' }
        });
      }
      
      res.json({
        success: true,
        data: stream
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'GET_FAILED', message: error.message }
      });
    }
  });
  
  // Get streams by community
  router.get('/community/:communityId', async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const streams = await streamService.getStreamsByCommunity(communityId);
      
      res.json({
        success: true,
        data: streams
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'GET_FAILED', message: error.message }
      });
    }
  });
  
  // Start a stream
  router.post('/:streamId/start', async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      await streamService.startStream(streamId);
      
      res.json({
        success: true,
        data: { message: 'Stream started successfully' }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'START_FAILED', message: error.message }
      });
    }
  });
  
  // End a stream
  router.post('/:streamId/end', async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      await streamService.endStream(streamId);
      
      res.json({
        success: true,
        data: { message: 'Stream ended successfully' }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'END_FAILED', message: error.message }
      });
    }
  });
  
  // Get stream status across platforms
  router.get('/:streamId/status', async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      const statuses = await streamService.getStreamStatus(streamId);
      
      res.json({
        success: true,
        data: statuses
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'STATUS_FAILED', message: error.message }
      });
    }
  });
  
  return router;
}
