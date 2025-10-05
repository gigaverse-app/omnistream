/**
 * Unit tests for Facebook provider
 */

import { FacebookProvider } from '../../../providers/facebook/index.js';
import { Platform, StreamStatus } from '../../../core/interfaces.js';
import { PlatformError } from '../../../core/errors.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FacebookProvider', () => {
  let provider: FacebookProvider;

  beforeEach(() => {
    provider = new FacebookProvider();
    jest.clearAllMocks();
  });

  describe('platform', () => {
    it('should return FACEBOOK platform', () => {
      expect(provider.platform).toBe(Platform.FACEBOOK);
    });
  });

  describe('getAuthUrl', () => {
    it('should generate valid OAuth URL', () => {
      const url = provider.getAuthUrl('community-123', 'http://localhost:3000/callback');

      expect(url).toContain('https://www.facebook.com');
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(url).toContain('state=community-123');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for long-lived tokens', async () => {
      const mockShortLivedResponse = {
        data: {
          access_token: 'short-lived-token',
          expires_in: 3600,
        },
      };

      const mockLongLivedResponse = {
        data: {
          access_token: 'long-lived-token',
          expires_in: 5184000,
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockShortLivedResponse)
        .mockResolvedValueOnce(mockLongLivedResponse);

      const tokens = await provider.exchangeCodeForTokens(
        'auth-code',
        'http://localhost:3000/callback'
      );

      expect(tokens.accessToken).toBe('long-lived-token');
      expect(tokens.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('createStream', () => {
    it('should create stream successfully', async () => {
      const mockPagesResponse = {
        data: {
          data: [
            {
              id: 'page-123',
              name: 'Test Page',
              access_token: 'page-access-token',
            },
          ],
        },
      };

      const mockLiveVideoResponse = {
        data: {
          id: 'live-video-123',
          stream_url: 'rtmps://example.com/stream',
          secure_stream_url: 'rtmps://example.com/stream',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockPagesResponse);
      mockedAxios.post.mockResolvedValueOnce(mockLiveVideoResponse);

      const streamConfig = {
        id: 'stream-id',
        communityId: 'community-123',
        title: 'Test Stream',
        description: 'Test Description',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.FACEBOOK],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tokens = {
        accessToken: 'access-token',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['pages_manage_posts'],
      };

      const result = await provider.createStream('community-123', streamConfig, tokens);

      expect(result.platform).toBe(Platform.FACEBOOK);
      expect(result.platformStreamId).toBe('live-video-123');
      expect(result.status).toBe(StreamStatus.SCHEDULED);
    });

    it('should throw error if no pages found', async () => {
      const mockPagesResponse = {
        data: {
          data: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockPagesResponse);

      const streamConfig = {
        id: 'stream-id',
        communityId: 'community-123',
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.FACEBOOK],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tokens = {
        accessToken: 'access-token',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['pages_manage_posts'],
      };

      await expect(provider.createStream('community-123', streamConfig, tokens)).rejects.toThrow(
        PlatformError
      );
    });
  });
});
