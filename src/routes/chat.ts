import { Router, Request, Response } from 'express';
import { Platform } from '../types';
import { ChatService } from '../services';

export function createChatRoutes(chatService: ChatService): Router {
  const router = Router();
  
  // Get messages from a stream
  router.get('/:streamId/messages', async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      const platform = req.query.platform as Platform | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      
      const messages = await chatService.getMessages(streamId, platform, limit);
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'GET_MESSAGES_FAILED', message: error.message }
      });
    }
  });
  
  // Post a message to platforms
  router.post('/:streamId/messages', async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      const { platforms, message } = req.body;
      
      if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PLATFORMS', message: 'At least one platform is required' }
        });
      }
      
      if (!message) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_MESSAGE', message: 'message is required' }
        });
      }
      
      const postedMessages = await chatService.postMessage(streamId, platforms as Platform[], message);
      
      res.json({
        success: true,
        data: postedMessages
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'POST_MESSAGE_FAILED', message: error.message }
      });
    }
  });
  
  // Pin a message
  router.post('/:streamId/messages/:messageId/pin', async (req: Request, res: Response) => {
    try {
      const { streamId, messageId } = req.params;
      const { platform } = req.body;
      
      if (!platform) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PLATFORM', message: 'platform is required' }
        });
      }
      
      await chatService.pinMessage(streamId, platform as Platform, messageId);
      
      res.json({
        success: true,
        data: { message: 'Message pinned successfully' }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'PIN_MESSAGE_FAILED', message: error.message }
      });
    }
  });
  
  // Highlight a message
  router.post('/:streamId/messages/:messageId/highlight', async (req: Request, res: Response) => {
    try {
      const { streamId, messageId } = req.params;
      const { platform } = req.body;
      
      if (!platform) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PLATFORM', message: 'platform is required' }
        });
      }
      
      await chatService.highlightMessage(streamId, platform as Platform, messageId);
      
      res.json({
        success: true,
        data: { message: 'Message highlighted successfully' }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'HIGHLIGHT_MESSAGE_FAILED', message: error.message }
      });
    }
  });
  
  return router;
}
