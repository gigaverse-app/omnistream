import { test, expect } from '@playwright/test';

test.describe('OmniStream API', () => {
  test('health check should return healthy status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
  });
  
  test('should get OAuth URL for YouTube', async ({ request }) => {
    const response = await request.get('/oauth/youtube/auth?communityId=test-community');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.authUrl).toContain('accounts.google.com');
    expect(data.data.authUrl).toContain('test-community');
  });
  
  test('should create a stream', async ({ request }) => {
    // First, simulate OAuth callback to save a token
    await request.get('/oauth/youtube/callback?code=test-code&state=test-community');
    
    // Create a stream
    const response = await request.post('/streams', {
      data: {
        communityId: 'test-community',
        title: 'Test Stream',
        description: 'Integration test stream',
        platforms: ['youtube']
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.title).toBe('Test Stream');
    expect(data.data.status).toBe('scheduled');
  });
  
  test('should get stream by ID', async ({ request }) => {
    // Setup: Create a stream first
    await request.get('/oauth/youtube/callback?code=test-code&state=test-community');
    
    const createResponse = await request.post('/streams', {
      data: {
        communityId: 'test-community',
        title: 'Test Stream',
        platforms: ['youtube']
      }
    });
    
    const createData = await createResponse.json();
    const streamId = createData.data.id;
    
    // Test: Get the stream
    const response = await request.get(`/streams/${streamId}`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(streamId);
  });
  
  test('should start and end a stream', async ({ request }) => {
    // Setup
    await request.get('/oauth/youtube/callback?code=test-code&state=test-community');
    
    const createResponse = await request.post('/streams', {
      data: {
        communityId: 'test-community',
        title: 'Test Stream',
        platforms: ['youtube']
      }
    });
    
    const createData = await createResponse.json();
    const streamId = createData.data.id;
    
    // Start the stream
    const startResponse = await request.post(`/streams/${streamId}/start`);
    expect(startResponse.ok()).toBeTruthy();
    
    let startData = await startResponse.json();
    expect(startData.success).toBe(true);
    
    // Verify status changed
    const statusResponse = await request.get(`/streams/${streamId}`);
    const statusData = await statusResponse.json();
    expect(statusData.data.status).toBe('live');
    
    // End the stream
    const endResponse = await request.post(`/streams/${streamId}/end`);
    expect(endResponse.ok()).toBeTruthy();
    
    const endData = await endResponse.json();
    expect(endData.success).toBe(true);
  });
  
  test('should get stream status across platforms', async ({ request }) => {
    // Setup
    await request.get('/oauth/youtube/callback?code=test-code&state=test-community');
    await request.get('/oauth/facebook/callback?code=test-code&state=test-community');
    
    const createResponse = await request.post('/streams', {
      data: {
        communityId: 'test-community',
        title: 'Multi-Platform Stream',
        platforms: ['youtube', 'facebook']
      }
    });
    
    const createData = await createResponse.json();
    const streamId = createData.data.id;
    
    // Get status
    const response = await request.get(`/streams/${streamId}/status`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });
  
  test('should handle errors gracefully', async ({ request }) => {
    // Try to get non-existent stream
    const response = await request.get('/streams/non-existent-id');
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('STREAM_NOT_FOUND');
  });
  
  test('should post message to chat', async ({ request }) => {
    // Setup
    await request.get('/oauth/youtube/callback?code=test-code&state=test-community');
    
    const createResponse = await request.post('/streams', {
      data: {
        communityId: 'test-community',
        title: 'Test Stream',
        platforms: ['youtube']
      }
    });
    
    const createData = await createResponse.json();
    const streamId = createData.data.id;
    
    // Post a message
    const response = await request.post(`/chat/${streamId}/messages`, {
      data: {
        platforms: ['youtube'],
        message: 'Hello from OmniStream!'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
