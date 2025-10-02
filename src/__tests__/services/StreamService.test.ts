import { StreamService } from '../../services/StreamService';
import { TokenManager } from '../../services/TokenManager';
import { Platform, StreamStatus } from '../../types';

describe('StreamService', () => {
  let streamService: StreamService;
  let tokenManager: TokenManager;
  
  beforeEach(() => {
    tokenManager = new TokenManager();
    streamService = new StreamService(tokenManager);
  });
  
  describe('createStream', () => {
    it('should create a stream', async () => {
      const communityId = 'test-community';
      
      // Setup token
      await tokenManager.saveToken(communityId, Platform.YOUTUBE, {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      });
      
      const stream = await streamService.createStream(communityId, {
        title: 'Test Stream',
        description: 'Test Description',
        platforms: [Platform.YOUTUBE]
      });
      
      expect(stream).toBeDefined();
      expect(stream.id).toBeDefined();
      expect(stream.communityId).toBe(communityId);
      expect(stream.title).toBe('Test Stream');
      expect(stream.status).toBe(StreamStatus.SCHEDULED);
      expect(stream.platforms).toContain(Platform.YOUTUBE);
    });
    
    it('should create a stream with multiple platforms', async () => {
      const communityId = 'test-community';
      
      // Setup tokens for multiple platforms
      await tokenManager.saveToken(communityId, Platform.YOUTUBE, {
        accessToken: 'yt_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      });
      await tokenManager.saveToken(communityId, Platform.FACEBOOK, {
        accessToken: 'fb_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.FACEBOOK
      });
      
      const stream = await streamService.createStream(communityId, {
        title: 'Multi-Platform Stream',
        platforms: [Platform.YOUTUBE, Platform.FACEBOOK]
      });
      
      expect(stream.platforms).toHaveLength(2);
      expect(stream.platforms).toContain(Platform.YOUTUBE);
      expect(stream.platforms).toContain(Platform.FACEBOOK);
    });
  });
  
  describe('getStream', () => {
    it('should retrieve a stream by ID', async () => {
      const communityId = 'test-community';
      
      await tokenManager.saveToken(communityId, Platform.YOUTUBE, {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      });
      
      const created = await streamService.createStream(communityId, {
        title: 'Test Stream',
        platforms: [Platform.YOUTUBE]
      });
      
      const retrieved = await streamService.getStream(created.id);
      
      expect(retrieved).toEqual(created);
    });
    
    it('should return null for non-existent stream', async () => {
      const retrieved = await streamService.getStream('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });
  
  describe('getStreamsByCommunity', () => {
    it('should retrieve all streams for a community', async () => {
      const communityId = 'test-community';
      
      await tokenManager.saveToken(communityId, Platform.YOUTUBE, {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      });
      
      await streamService.createStream(communityId, {
        title: 'Stream 1',
        platforms: [Platform.YOUTUBE]
      });
      
      await streamService.createStream(communityId, {
        title: 'Stream 2',
        platforms: [Platform.YOUTUBE]
      });
      
      const streams = await streamService.getStreamsByCommunity(communityId);
      
      expect(streams).toHaveLength(2);
      expect(streams[0].communityId).toBe(communityId);
      expect(streams[1].communityId).toBe(communityId);
    });
  });
  
  describe('startStream and endStream', () => {
    it('should start and end a stream', async () => {
      const communityId = 'test-community';
      
      await tokenManager.saveToken(communityId, Platform.YOUTUBE, {
        accessToken: 'test_token',
        expiresAt: Date.now() + 3600000,
        platform: Platform.YOUTUBE
      });
      
      const stream = await streamService.createStream(communityId, {
        title: 'Test Stream',
        platforms: [Platform.YOUTUBE]
      });
      
      await streamService.startStream(stream.id);
      let retrieved = await streamService.getStream(stream.id);
      expect(retrieved?.status).toBe(StreamStatus.LIVE);
      
      await streamService.endStream(stream.id);
      retrieved = await streamService.getStream(stream.id);
      expect(retrieved?.status).toBe(StreamStatus.ENDED);
    });
  });
});
