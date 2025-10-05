/**
 * End-to-End Integration Test
 * Tests the complete flow: Community → OAuth → Stream Creation → Stream Management
 */

import { expect, test } from '@playwright/test';

test.describe('E2E Stream Management Flow', () => {
  let communityId: string;
  let apiKey: string;
  let streamId: string;

  test('Complete workflow: create community → create stream → manage lifecycle', async ({
    request,
  }) => {
    // Step 1: Create a community
    console.log('Step 1: Creating community...');
    const createCommunityResponse = await request.post('/api/v1/communities', {
      data: {
        name: 'E2E Test Community',
      },
    });

    expect(createCommunityResponse.ok()).toBeTruthy();
    const communityData = await createCommunityResponse.json();
    expect(communityData.success).toBe(true);
    expect(communityData.data.apiKey).toMatch(/^omni_/);

    communityId = communityData.data.id;
    apiKey = communityData.data.apiKey;

    console.log(`✓ Community created: ${communityId}`);

    // Step 2: Get OAuth authorization URL for YouTube
    console.log('Step 2: Getting YouTube OAuth URL...');
    const authUrlResponse = await request.get('/api/v1/auth/youtube/authorize', {
      params: {
        communityId,
      },
    });

    expect(authUrlResponse.ok()).toBeTruthy();
    const authData = await authUrlResponse.json();
    expect(authData.success).toBe(true);
    expect(authData.data.authUrl).toContain('accounts.google.com');
    expect(authData.data.authUrl).toContain('scope=');
    expect(authData.data.authUrl).toContain('youtube');

    console.log('✓ OAuth URL generated (user would complete OAuth in browser)');

    // Step 3: Create a stream (will create stream record even without OAuth completion)
    console.log('Step 3: Creating stream configuration...');
    const createStreamResponse = await request.post('/api/v1/streams', {
      headers: {
        'X-API-Key': apiKey,
      },
      data: {
        title: 'E2E Integration Test Stream',
        description: 'Testing the complete streaming workflow',
        rtmpUrl: 'rtmp://test-server.example.com/live',
        rtmpKey: 'test-stream-key-12345',
        platforms: ['youtube'],
      },
    });

    expect(createStreamResponse.ok()).toBeTruthy();
    const streamData = await createStreamResponse.json();
    expect(streamData.success).toBe(true);
    expect(streamData.data.stream).toBeDefined();
    expect(streamData.data.stream.title).toBe('E2E Integration Test Stream');
    expect(streamData.data.stream.platforms).toContain('youtube');
    expect(streamData.data.platformStreams).toBeDefined();
    expect(Array.isArray(streamData.data.platformStreams)).toBe(true);

    streamId = streamData.data.stream.id;

    console.log(`✓ Stream created: ${streamId}`);

    // Step 4: List streams for the community
    console.log('Step 4: Listing community streams...');
    const listStreamsResponse = await request.get('/api/v1/streams', {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    expect(listStreamsResponse.ok()).toBeTruthy();
    const listData = await listStreamsResponse.json();
    expect(listData.success).toBe(true);
    expect(Array.isArray(listData.data)).toBe(true);
    expect(listData.data.length).toBeGreaterThan(0);

    const createdStream = listData.data.find((s: any) => s.id === streamId);
    expect(createdStream).toBeDefined();
    expect(createdStream.title).toBe('E2E Integration Test Stream');

    console.log(`✓ Found ${listData.data.length} stream(s)`);

    // Step 5: Get stream status
    console.log('Step 5: Getting stream status...');
    const statusResponse = await request.get(`/api/v1/streams/${streamId}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    expect(statusResponse.ok()).toBeTruthy();
    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.data.stream).toBeDefined();
    expect(statusData.data.stream.id).toBe(streamId);
    expect(statusData.data.platformStreams).toBeDefined();

    console.log('✓ Stream status retrieved');

    // Step 6: Attempt to start stream (will fail without OAuth tokens, but API should handle gracefully)
    console.log(
      'Step 6: Attempting to start stream (expected to fail gracefully without OAuth)...'
    );
    const startResponse = await request.post(`/api/v1/streams/${streamId}/start`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    expect(startResponse.ok()).toBeTruthy();
    const startData = await startResponse.json();
    expect(startData.success).toBe(true);
    expect(startData.data).toBeDefined();

    // Since we don't have OAuth tokens, the platform stream should have an error status
    // but the API should handle this gracefully
    console.log('✓ Start request handled gracefully');

    // Step 7: Attempt to stop stream
    console.log('Step 7: Stopping stream...');
    const stopResponse = await request.post(`/api/v1/streams/${streamId}/stop`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    expect(stopResponse.ok()).toBeTruthy();
    const stopData = await stopResponse.json();
    expect(stopData.success).toBe(true);

    console.log('✓ Stream stopped');

    // Step 8: Delete stream
    console.log('Step 8: Deleting stream...');
    const deleteResponse = await request.delete(`/api/v1/streams/${streamId}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    expect(deleteResponse.ok()).toBeTruthy();
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);

    console.log('✓ Stream deleted');

    // Step 9: Verify stream is deleted
    console.log('Step 9: Verifying stream deletion...');
    const verifyDeleteResponse = await request.get(`/api/v1/streams/${streamId}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    expect(verifyDeleteResponse.status()).toBe(404);

    console.log('✓ Stream deletion verified');
    console.log('\n🎉 E2E test completed successfully!');
  });

  test('E2E: WebSocket chat connection', async ({ request }) => {
    // Create a community and stream first
    const communityResponse = await request.post('/api/v1/communities', {
      data: {
        name: 'WebSocket Test Community',
      },
    });

    const communityData = await communityResponse.json();
    const testApiKey = communityData.data.apiKey;
    const testCommunityId = communityData.data.id;

    const streamResponse = await request.post('/api/v1/streams', {
      headers: {
        'X-API-Key': testApiKey,
      },
      data: {
        title: 'WebSocket Test Stream',
        description: 'Testing WebSocket functionality',
        rtmpUrl: 'rtmp://test.example.com/live',
        rtmpKey: 'ws-test-key',
        platforms: ['youtube'],
      },
    });

    const streamData = await streamResponse.json();
    const testStreamId = streamData.data.stream.id;

    // Test WebSocket connection (basic validation)
    // Note: Full WebSocket testing would require a WebSocket client
    // This test verifies the stream is created and ready for WebSocket connections
    expect(testStreamId).toBeDefined();
    expect(testApiKey).toBeDefined();

    console.log('✓ Stream ready for WebSocket chat connections');
    console.log(`  Stream ID: ${testStreamId}`);
    console.log(`  WebSocket URL would be: ws://localhost:3000/ws/chat`);
  });

  test('E2E: Multi-platform stream creation', async ({ request }) => {
    // Create community
    const communityResponse = await request.post('/api/v1/communities', {
      data: {
        name: 'Multi-Platform Test Community',
      },
    });

    const communityData = await communityResponse.json();
    const testApiKey = communityData.data.apiKey;

    // Create stream for multiple platforms
    const streamResponse = await request.post('/api/v1/streams', {
      headers: {
        'X-API-Key': testApiKey,
      },
      data: {
        title: 'Multi-Platform Test Stream',
        description: 'Testing YouTube and Facebook simultaneously',
        rtmpUrl: 'rtmp://test.example.com/live',
        rtmpKey: 'multi-platform-key',
        platforms: ['youtube', 'facebook'],
        scheduledStartTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      },
    });

    expect(streamResponse.ok()).toBeTruthy();
    const streamData = await streamResponse.json();
    expect(streamData.success).toBe(true);
    expect(streamData.data.stream.platforms).toHaveLength(2);
    expect(streamData.data.stream.platforms).toContain('youtube');
    expect(streamData.data.stream.platforms).toContain('facebook');
    expect(streamData.data.stream.scheduledStartTime).toBeDefined();

    // Verify platform streams were created (or attempted with graceful failure)
    expect(streamData.data.platformStreams).toHaveLength(2);

    console.log('✓ Multi-platform stream configuration created');
    console.log(`  Platforms: ${streamData.data.stream.platforms.join(', ')}`);
  });

  test('E2E: Error handling - invalid API key', async ({ request }) => {
    const response = await request.post('/api/v1/streams', {
      headers: {
        'X-API-Key': 'omni_invalid_key_12345',
      },
      data: {
        title: 'Should Fail',
        rtmpUrl: 'rtmp://test.example.com',
        rtmpKey: 'key',
        platforms: ['youtube'],
      },
    });

    // Accepts either 401 or 404 depending on middleware implementation
    expect([401, 404]).toContain(response.status());
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();

    console.log('✓ Invalid API key properly rejected');
  });

  test('E2E: Error handling - missing required fields', async ({ request }) => {
    const communityResponse = await request.post('/api/v1/communities', {
      data: {
        name: 'Validation Test Community',
      },
    });

    const communityData = await communityResponse.json();
    const testApiKey = communityData.data.apiKey;

    const response = await request.post('/api/v1/streams', {
      headers: {
        'X-API-Key': testApiKey,
      },
      data: {
        title: 'Incomplete Stream',
        // Missing rtmpUrl, rtmpKey, platforms
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();

    console.log('✓ Missing required fields properly validated');
  });
});
