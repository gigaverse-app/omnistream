/**
 * Unit tests for auth API routes
 */

import request from 'supertest';
import express from 'express';
import authRouter from '../../../api/routes/auth.js';
import { db } from '../../../database/index.js';
import { errorHandler } from '../../../api/middleware/error-handler.js';
import { Platform } from '../../../core/interfaces.js';

// Mock axios for OAuth token exchanges
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);
app.use(errorHandler);

describe('Auth API Routes', () => {
  let community: any;

  beforeEach(async () => {
    community = await db.createCommunity('Test Community');
    jest.clearAllMocks();
  });

  describe('GET /api/v1/auth/:platform/authorize', () => {
    it('should return 400 without communityId', async () => {
      const response = await request(app).get('/api/v1/auth/youtube/authorize');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('communityId');
    });

    it('should return 404 for non-existent community', async () => {
      const response = await request(app).get(
        '/api/v1/auth/youtube/authorize?communityId=non-existent-id'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return YouTube auth URL', async () => {
      const response = await request(app).get(
        `/api/v1/auth/youtube/authorize?communityId=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.authUrl).toContain('accounts.google.com');
      expect(response.body.data.platform).toBe('youtube');
      expect(response.body.data.communityId).toBe(community.id);
    });

    it('should return Facebook auth URL', async () => {
      const response = await request(app).get(
        `/api/v1/auth/facebook/authorize?communityId=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.authUrl).toContain('facebook.com');
      expect(response.body.data.platform).toBe('facebook');
    });

    it('should return TikTok auth URL (even though unsupported)', async () => {
      const response = await request(app).get(
        `/api/v1/auth/tiktok/authorize?communityId=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.platform).toBe('tiktok');
    });

    it('should return 400 for unsupported platform', async () => {
      const response = await request(app).get(
        `/api/v1/auth/instagram/authorize?communityId=${community.id}`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/:platform/callback', () => {
    it('should return 400 without code parameter', async () => {
      const response = await request(app).get(
        `/api/v1/auth/youtube/callback?state=${community.id}`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Authorization code');
    });

    it('should return 400 without state parameter', async () => {
      const response = await request(app).get('/api/v1/auth/youtube/callback?code=auth-code');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Community ID');
    });

    it('should return 404 for non-existent community', async () => {
      const response = await request(app).get(
        '/api/v1/auth/youtube/callback?code=auth-code&state=non-existent-id'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should successfully exchange code for YouTube tokens', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
        },
      });

      const response = await request(app).get(
        `/api/v1/auth/youtube/callback?code=auth-code&state=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.text).toContain('Authorization Successful');
      expect(response.text).toContain('youtube');

      // Verify token was stored
      const token = await db.getOAuthToken(community.id, Platform.YOUTUBE);
      expect(token).toBeDefined();
      expect(token?.accessToken).toBe('test-access-token');
    });

    it('should successfully exchange code for Facebook tokens', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            access_token: 'short-lived-token',
          },
        })
        .mockResolvedValueOnce({
          data: {
            access_token: 'long-lived-token',
            expires_in: 5184000,
          },
        });

      const response = await request(app).get(
        `/api/v1/auth/facebook/callback?code=auth-code&state=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.text).toContain('Authorization Successful');
      expect(response.text).toContain('facebook');

      // Verify token was stored
      const token = await db.getOAuthToken(community.id, Platform.FACEBOOK);
      expect(token).toBeDefined();
      expect(token?.accessToken).toBe('long-lived-token');
    });

    it('should handle OAuth error responses', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('OAuth failed'));

      const response = await request(app).get(
        `/api/v1/auth/youtube/callback?code=bad-code&state=${community.id}`
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/:platform/status', () => {
    it('should return 400 without communityId', async () => {
      const response = await request(app).get('/api/v1/auth/youtube/status');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('communityId');
    });

    it('should return 404 for non-existent community', async () => {
      const response = await request(app).get(
        '/api/v1/auth/youtube/status?communityId=non-existent-id'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return not connected when no token exists', async () => {
      const response = await request(app).get(
        `/api/v1/auth/youtube/status?communityId=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connected).toBe(false);
      expect(response.body.data.hasToken).toBe(false);
    });

    it('should return connected when token exists', async () => {
      // Store a token first
      await db.saveOAuthToken(community.id, Platform.YOUTUBE, {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['youtube.force-ssl'],
      });

      const response = await request(app).get(
        `/api/v1/auth/youtube/status?communityId=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.connected).toBe(true);
      expect(response.body.data.hasToken).toBe(true);
      expect(response.body.data.platform).toBe('youtube');
    });

    it('should work for all supported platforms', async () => {
      // Test Facebook
      const fbResponse = await request(app).get(
        `/api/v1/auth/facebook/status?communityId=${community.id}`
      );
      expect(fbResponse.status).toBe(200);
      expect(fbResponse.body.connected).toBe(false);

      // Test TikTok
      const ttResponse = await request(app).get(
        `/api/v1/auth/tiktok/status?communityId=${community.id}`
      );
      expect(ttResponse.status).toBe(200);
      expect(ttResponse.body.connected).toBe(false);
    });
  });

  describe('DELETE /api/v1/auth/:platform', () => {
    beforeEach(async () => {
      // Store a token first
      await db.saveOAuthToken(community.id, Platform.YOUTUBE, {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['youtube.force-ssl'],
      });
    });

    it('should return 400 without communityId', async () => {
      const response = await request(app).delete('/api/v1/auth/youtube');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent community', async () => {
      const response = await request(app).delete(
        '/api/v1/auth/youtube?communityId=non-existent-id'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should successfully revoke YouTube authorization', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const response = await request(app).delete(
        `/api/v1/auth/youtube?communityId=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('revoked');

      // Verify token was deleted
      const token = await db.getOAuthToken(community.id, Platform.YOUTUBE);
      expect(token).toBeNull();
    });

    it('should successfully revoke Facebook authorization', async () => {
      await db.saveOAuthToken(community.id, Platform.FACEBOOK, {
        accessToken: 'fb-token',
        expiresAt: new Date(Date.now() + 3600000),
        scope: ['pages_read_engagement'],
      });

      mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

      const response = await request(app).delete(
        `/api/v1/auth/facebook?communityId=${community.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify token was deleted
      const token = await db.getOAuthToken(community.id, Platform.FACEBOOK);
      expect(token).toBeNull();
    });

    it('should handle revocation errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Revocation failed'));

      const response = await request(app).delete(
        `/api/v1/auth/youtube?communityId=${community.id}`
      );

      // Should still delete the token even if remote revocation fails
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const token = await db.getOAuthToken(community.id, Platform.YOUTUBE);
      expect(token).toBeNull();
    });
  });
});
