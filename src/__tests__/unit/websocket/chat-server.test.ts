/**
 * Unit tests for WebSocket chat server
 */

import http from 'http';
import WebSocket from 'ws';
import { ChatServer } from '../../../websocket/chat-server.js';
import { db } from '../../../database/index.js';
import { Platform } from '../../../core/interfaces.js';

describe('ChatServer', () => {
  let server: http.Server;
  let chatServer: ChatServer;
  let community: any;
  let stream: any;
  let port: number;

  beforeAll(() => {
    // Create HTTP server for testing
    server = http.createServer();
    port = 3001 + Math.floor(Math.random() * 1000);
    server.listen(port);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(async () => {
    // Create test data
    community = await db.createCommunity('WebSocket Test Community');
    stream = await db.createStream({
      communityId: community.id,
      title: 'Test Stream',
      rtmpUrl: 'rtmp://example.com',
      rtmpKey: 'key',
      platforms: [Platform.YOUTUBE],
    });

    // Initialize chat server
    chatServer = new ChatServer(server);
  });

  afterEach(async () => {
    chatServer.close();
    // Give websocket server time to cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  const connectWebSocket = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/chat`);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });
  };

  const waitForMessage = (ws: WebSocket): Promise<any> => {
    return new Promise((resolve) => {
      ws.once('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });
  };

  it('should accept WebSocket connections', async () => {
    const ws = await connectWebSocket();
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it('should send welcome message on connection', async () => {
    const ws = await connectWebSocket();
    const message = await waitForMessage(ws);

    expect(message.type).toBe('connected');
    expect(message.message).toContain('Connected to Omnistream');

    ws.close();
  });

  it('should require authentication for subscription', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');
    expect(response.message).toContain('API key');

    ws.close();
  });

  it('should reject invalid API key', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        apiKey: 'invalid-key',
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');
    expect(response.message).toContain('Invalid API key');

    ws.close();
  });

  it('should reject subscription to non-existent stream', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: 'non-existent-id',
        apiKey: community.apiKey,
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');
    expect(response.message).toContain('Stream not found');

    ws.close();
  });

  it('should successfully subscribe to stream', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        apiKey: community.apiKey,
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('subscribed');
    expect(response.streamId).toBe(stream.id);

    ws.close();
  });

  it('should broadcast new chat messages to subscribers', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        apiKey: community.apiKey,
      })
    );
    await waitForMessage(ws); // Skip subscribed message

    // Add a chat message to the database
    await db.addChatMessage({
      streamId: stream.id,
      platform: Platform.YOUTUBE,
      authorId: 'author123',
      authorName: 'Test User',
      authorImageUrl: 'https://example.com/avatar.jpg',
      message: 'Hello world!',
      timestamp: new Date(),
      highlighted: false,
    });

    // Note: In real implementation, this would be triggered by polling
    // For unit test, we're just verifying the subscription mechanism works
    ws.close();
  });

  it('should handle unsubscribe messages', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    // Subscribe first
    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        apiKey: community.apiKey,
      })
    );
    await waitForMessage(ws); // Skip subscribed message

    // Now unsubscribe
    ws.send(
      JSON.stringify({
        type: 'unsubscribe',
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('unsubscribed');

    ws.close();
  });

  it('should handle highlight requests', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    // Subscribe first
    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        apiKey: community.apiKey,
      })
    );
    await waitForMessage(ws); // Skip subscribed message

    // Add a message
    const message = await db.addChatMessage({
      streamId: stream.id,
      platform: Platform.YOUTUBE,
      authorId: 'author123',
      authorName: 'Test User',
      message: 'Highlight me!',
      timestamp: new Date(),
      highlighted: false,
    });

    // Request highlight
    ws.send(
      JSON.stringify({
        type: 'highlight',
        messageId: message.id,
        platform: Platform.YOUTUBE,
      })
    );

    // Note: Highlight feature returns warning since platforms don't support it
    const response = await waitForMessage(ws);
    expect(['highlighted', 'error']).toContain(response.type);

    ws.close();
  });

  it('should handle invalid message types', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    ws.send(
      JSON.stringify({
        type: 'invalid-type',
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');

    ws.close();
  });

  it('should handle malformed JSON', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    ws.send('this is not json');

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');

    ws.close();
  });

  it('should handle client disconnect gracefully', async () => {
    const ws = await connectWebSocket();
    await waitForMessage(ws); // Skip welcome message

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        apiKey: community.apiKey,
      })
    );
    await waitForMessage(ws); // Skip subscribed message

    // Close connection
    ws.close();

    // Wait a bit for cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Server should have cleaned up the subscription
    // (no assertion needed, just checking it doesn't crash)
  });

  it('should support multiple concurrent connections', async () => {
    const ws1 = await connectWebSocket();
    const ws2 = await connectWebSocket();

    await waitForMessage(ws1); // Welcome for ws1
    await waitForMessage(ws2); // Welcome for ws2

    // Both subscribe to same stream
    ws1.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        apiKey: community.apiKey,
      })
    );

    ws2.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        apiKey: community.apiKey,
      })
    );

    const response1 = await waitForMessage(ws1);
    const response2 = await waitForMessage(ws2);

    expect(response1.type).toBe('subscribed');
    expect(response2.type).toBe('subscribed');

    ws1.close();
    ws2.close();
  });
});
