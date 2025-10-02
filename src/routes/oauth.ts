import { Router, Request, Response } from 'express';
import { Platform } from '../types';
import { PlatformProviderFactory } from '../providers';
import { TokenManager } from '../services';

export function createOAuthRoutes(tokenManager: TokenManager): Router {
  const router = Router();
  
  // Get OAuth URL for a platform
  router.get('/:platform/auth', (req: Request, res: Response) => {
    try {
      const platform = req.params.platform as Platform;
      const communityId = req.query.communityId as string;
      
      if (!communityId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_COMMUNITY_ID', message: 'communityId is required' }
        });
      }
      
      const provider = PlatformProviderFactory.getProvider(platform);
      const redirectUri = `${req.protocol}://${req.get('host')}/oauth/${platform}/callback`;
      const authUrl = provider.getAuthUrl(communityId, redirectUri);
      
      res.json({
        success: true,
        data: { authUrl }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  });
  
  // OAuth callback
  router.get('/:platform/callback', async (req: Request, res: Response) => {
    try {
      const platform = req.params.platform as Platform;
      const code = req.query.code as string;
      const state = req.query.state as string; // communityId
      
      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CALLBACK', message: 'Missing code or state' }
        });
      }
      
      const provider = PlatformProviderFactory.getProvider(platform);
      const token = await provider.exchangeCodeForToken(code);
      
      await tokenManager.saveToken(state, platform, token);
      
      res.json({
        success: true,
        data: { message: 'Authentication successful', platform, communityId: state }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: error.message }
      });
    }
  });
  
  // Delete token
  router.delete('/:platform/token', async (req: Request, res: Response) => {
    try {
      const platform = req.params.platform as Platform;
      const communityId = req.query.communityId as string;
      
      if (!communityId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_COMMUNITY_ID', message: 'communityId is required' }
        });
      }
      
      await tokenManager.deleteToken(communityId, platform);
      
      res.json({
        success: true,
        data: { message: 'Token deleted successfully' }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: error.message }
      });
    }
  });
  
  return router;
}
