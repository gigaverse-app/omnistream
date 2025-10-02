import { TokenManager } from '../../services/TokenManager';
import { Platform } from '../../types';

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  
  beforeEach(() => {
    tokenManager = new TokenManager();
  });
  
  describe('saveToken and getToken', () => {
    it('should save and retrieve a token', async () => {
      const communityId = 'test-community';
      const platform = Platform.YOUTUBE;
      const token = {
        accessToken: 'test_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        platform
      };
      
      await tokenManager.saveToken(communityId, platform, token);
      const retrieved = await tokenManager.getToken(communityId, platform);
      
      expect(retrieved).toEqual(token);
    });
    
    it('should return null for non-existent token', async () => {
      const retrieved = await tokenManager.getToken('non-existent', Platform.YOUTUBE);
      expect(retrieved).toBeNull();
    });
  });
  
  describe('deleteToken', () => {
    it('should delete a token', async () => {
      const communityId = 'test-community';
      const platform = Platform.YOUTUBE;
      const token = {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform
      };
      
      await tokenManager.saveToken(communityId, platform, token);
      await tokenManager.deleteToken(communityId, platform);
      
      const retrieved = await tokenManager.getToken(communityId, platform);
      expect(retrieved).toBeNull();
    });
  });
  
  describe('refreshTokenIfNeeded', () => {
    it('should not refresh token if not expired', async () => {
      const communityId = 'test-community';
      const platform = Platform.YOUTUBE;
      const token = {
        accessToken: 'test_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        platform
      };
      
      await tokenManager.saveToken(communityId, platform, token);
      const refreshed = await tokenManager.refreshTokenIfNeeded(communityId, platform);
      
      expect(refreshed.accessToken).toBe(token.accessToken);
    });
    
    it('should refresh token if expired', async () => {
      const communityId = 'test-community';
      const platform = Platform.YOUTUBE;
      const token = {
        accessToken: 'old_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 60000, // 1 minute from now (should refresh)
        platform
      };
      
      await tokenManager.saveToken(communityId, platform, token);
      const refreshed = await tokenManager.refreshTokenIfNeeded(communityId, platform);
      
      expect(refreshed.accessToken).not.toBe(token.accessToken);
      expect(refreshed.expiresAt).toBeGreaterThan(token.expiresAt);
    });
    
    it('should throw error if token does not exist', async () => {
      await expect(
        tokenManager.refreshTokenIfNeeded('non-existent', Platform.YOUTUBE)
      ).rejects.toThrow();
    });
  });
});
