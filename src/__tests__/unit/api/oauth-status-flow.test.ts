/**
 * Integration test for OAuth connection status flow
 * Tests the complete flow: community creation → OAuth → status check
 */

import request from 'supertest';
import express from 'express';
import communitiesRouter from '../../../api/routes/communities.js';
import authRouter from '../../../api/routes/auth.js';
import { errorHandler } from '../../../api/middleware/error-handler.js';
import { db } from '../../../database/index.js';
import { Platform } from '../../../core/interfaces.js';

// Mock axios for OAuth token exchanges
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

const app = express();
app.use(express.json());
app.use('/api/v1/communities', communitiesRouter);
app.use('/api/v1/auth', authRouter);
app.use(errorHandler);

describe('OAuth Connection Status Flow', () => {
  let communityId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    db.clearAll();
  });

  it('should complete full OAuth connection status flow', async () => {
    // Step 1: Create a community (no API key needed)
    const createResponse = await request(app)
      .post('/api/v1/communities')
      .send({ name: 'Test Community' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    communityId = createResponse.body.data.id;
    expect(communityId).toBeDefined();

    // Step 2: Check initial OAuth status (should be not connected)
    const initialStatusResponse = await request(app).get(
      `/api/v1/auth/youtube/status?communityId=${communityId}`
    );

    expect(initialStatusResponse.status).toBe(200);
    expect(initialStatusResponse.body.success).toBe(true);
    expect(initialStatusResponse.body.connected).toBe(false);
    expect(initialStatusResponse.body.data.hasToken).toBe(false);

    // Step 3: Get OAuth authorization URL
    const authUrlResponse = await request(app).get(
      `/api/v1/auth/youtube/authorize?communityId=${communityId}`
    );

    expect(authUrlResponse.status).toBe(200);
    expect(authUrlResponse.body.success).toBe(true);
    expect(authUrlResponse.body.data.authUrl).toContain('accounts.google.com');
    expect(authUrlResponse.body.data.authUrl).toContain(`state=${communityId}`);

    // Step 4: Simulate OAuth callback (token exchange)
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
      },
    });

    const callbackResponse = await request(app).get(
      `/api/v1/auth/youtube/callback?code=test-code&state=${communityId}`
    );

    expect(callbackResponse.status).toBe(200);
    expect(callbackResponse.text).toContain('Authorization Successful');

    // Step 5: Verify OAuth token was saved
    const savedToken = await db.getOAuthToken(communityId, Platform.YOUTUBE);
    expect(savedToken).toBeDefined();
    expect(savedToken?.accessToken).toBe('test-access-token');

    // Step 6: Check OAuth status after connection (should be connected)
    const connectedStatusResponse = await request(app).get(
      `/api/v1/auth/youtube/status?communityId=${communityId}`
    );

    expect(connectedStatusResponse.status).toBe(200);
    expect(connectedStatusResponse.body.success).toBe(true);
    expect(connectedStatusResponse.body.connected).toBe(true);
    expect(connectedStatusResponse.body.data.hasToken).toBe(true);
    expect(connectedStatusResponse.body.data.platform).toBe('youtube');

    // Step 7: Test multiple platforms can have independent status
    const facebookStatusResponse = await request(app).get(
      `/api/v1/auth/facebook/status?communityId=${communityId}`
    );

    expect(facebookStatusResponse.status).toBe(200);
    expect(facebookStatusResponse.body.connected).toBe(false); // Facebook not connected

    const youtubeStatusResponse2 = await request(app).get(
      `/api/v1/auth/youtube/status?communityId=${communityId}`
    );

    expect(youtubeStatusResponse2.body.connected).toBe(true); // YouTube still connected
  });

  it('should return correct status for different communities', async () => {
    // Create two communities
    const community1Response = await request(app)
      .post('/api/v1/communities')
      .send({ name: 'Community 1' });
    const community1Id = community1Response.body.data.id;

    const community2Response = await request(app)
      .post('/api/v1/communities')
      .send({ name: 'Community 2' });
    const community2Id = community2Response.body.data.id;

    // Connect YouTube for community 1 only
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'community1-token',
        refresh_token: 'community1-refresh',
        expires_in: 3600,
        scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
      },
    });

    await request(app).get(`/api/v1/auth/youtube/callback?code=test-code&state=${community1Id}`);

    // Check status for community 1 (should be connected)
    const community1Status = await request(app).get(
      `/api/v1/auth/youtube/status?communityId=${community1Id}`
    );
    expect(community1Status.body.connected).toBe(true);

    // Check status for community 2 (should NOT be connected)
    const community2Status = await request(app).get(
      `/api/v1/auth/youtube/status?communityId=${community2Id}`
    );
    expect(community2Status.body.connected).toBe(false);
  });

  it('should handle OAuth disconnection', async () => {
    // Create community and connect YouTube
    const createResponse = await request(app)
      .post('/api/v1/communities')
      .send({ name: 'Test Community' });
    communityId = createResponse.body.data.id;

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
      },
    });

    await request(app).get(`/api/v1/auth/youtube/callback?code=test-code&state=${communityId}`);

    // Verify connected
    const connectedStatus = await request(app).get(
      `/api/v1/auth/youtube/status?communityId=${communityId}`
    );
    expect(connectedStatus.body.connected).toBe(true);

    // Disconnect (revoke tokens)
    mockedAxios.post.mockResolvedValueOnce({ data: {} });
    await request(app).delete(`/api/v1/auth/youtube?communityId=${communityId}`);

    // Verify disconnected
    const disconnectedStatus = await request(app).get(
      `/api/v1/auth/youtube/status?communityId=${communityId}`
    );
    expect(disconnectedStatus.body.connected).toBe(false);
  });

  it('should work without API keys (communityId-based authentication)', async () => {
    // This test validates the new authentication model

    // Create a community
    const createResponse = await request(app)
      .post('/api/v1/communities')
      .send({ name: 'Dashboard Test Community' });

    expect(createResponse.status).toBe(201);
    const community = createResponse.body.data;
    expect(community.id).toBeDefined();
    expect(community.name).toBe('Dashboard Test Community');
    // No API key in response
    expect(community.apiKey).toBeUndefined();

    // Check OAuth status using communityId only (no API key needed)
    const statusResponse = await request(app).get(
      `/api/v1/auth/youtube/status?communityId=${community.id}`
    );

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.success).toBe(true);
    expect(statusResponse.body.connected).toBe(false);
  });
});
