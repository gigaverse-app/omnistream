import { YouTubeProvider } from '../../providers/YouTubeProvider';
import { Platform, StreamStatus } from '../../types';

describe('YouTubeProvider', () => {
  let provider: YouTubeProvider;
  
  beforeEach(() => {
    provider = new YouTubeProvider();
  });
  
  describe('getAuthUrl', () => {
    it('should return a valid OAuth URL', () => {
      const communityId = 'test-community';
      const redirectUri = 'http://localhost:3000/callback';
      
      const authUrl = provider.getAuthUrl(communityId, redirectUri);
      
      expect(authUrl).toContain('accounts.google.com');
      expect(authUrl).toContain('oauth2');
      expect(authUrl).toContain(communityId);
    });
  });
  
  describe('exchangeCodeForToken', () => {
    it('should exchange code for token', async () => {
      const code = 'test-code';
      
      const token = await provider.exchangeCodeForToken(code);
      
      expect(token).toBeDefined();
      expect(token.platform).toBe(Platform.YOUTUBE);
      expect(token.accessToken).toContain('yt_access_');
      expect(token.refreshToken).toBeDefined();
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh an expired token', async () => {
      const oldToken = {
        accessToken: 'old_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() - 1000,
        platform: Platform.YOUTUBE
      };
      
      const newToken = await provider.refreshToken(oldToken);
      
      expect(newToken.accessToken).not.toBe(oldToken.accessToken);
      expect(newToken.expiresAt).toBeGreaterThan(oldToken.expiresAt);
    });
  });
  
  describe('createStream', () => {
    it('should create a stream with RTMP credentials', async () => {
      const token = {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      };
      
      const result = await provider.createStream(token, 'Test Stream', 'Test Description');
      
      expect(result).toBeDefined();
      expect(result.streamId).toContain('yt_stream_');
      expect(result.rtmpUrl).toContain('rtmp://');
      expect(result.streamKey).toBeDefined();
    });
    
    it('should create a scheduled stream', async () => {
      const token = {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      };
      const scheduledTime = new Date(Date.now() + 86400000);
      
      const result = await provider.createStream(token, 'Scheduled Stream', undefined, scheduledTime);
      
      expect(result).toBeDefined();
      expect(result.streamId).toBeDefined();
    });
  });
  
  describe('getStreamStatus', () => {
    it('should return stream metadata', async () => {
      const token = {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      };
      const streamId = 'test_stream_id';
      
      const status = await provider.getStreamStatus(token, streamId);
      
      expect(status).toBeDefined();
      expect(status.platform).toBe(Platform.YOUTUBE);
      expect(status.streamId).toBe(streamId);
      expect(status.status).toBe(StreamStatus.SCHEDULED);
    });
  });
  
  describe('postMessage', () => {
    it('should post a message to chat', async () => {
      const token = {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      };
      const streamId = 'test_stream_id';
      const message = 'Hello, world!';
      
      const result = await provider.postMessage(token, streamId, message);
      
      expect(result).toBeDefined();
      expect(result.platform).toBe(Platform.YOUTUBE);
      expect(result.content).toBe(message);
      expect(result.streamId).toBe(streamId);
    });
  });
});
