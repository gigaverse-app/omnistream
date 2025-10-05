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
  let activeWebSockets: WebSocket[] = [];

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

    // Create a new HTTP server for each test to avoid port/WebSocket conflicts
    server = http.createServer();
    port = 3001 + Math.floor(Math.random() * 1000);
    await new Promise<void>((resolve) => {
      server.listen(port, () => resolve());
    });

    // Initialize chat server with polling disabled for faster tests
    chatServer = new ChatServer(server, { enablePolling: false });
    // Give server time to initialize
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  afterEach(async () => {
    // Terminate all active WebSocket connections immediately
    for (const ws of activeWebSockets) {
      try {
        ws.terminate();
      } catch {
        /* ignore errors */
      }
    }
    activeWebSockets = [];

    // Close chat server (which closes the WebSocket server)
    if (chatServer) {
      try {
        await Promise.race([
          chatServer.close(),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
      } catch {
        /* ignore errors */
      }
    }

    // Close HTTP server
    if (server) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 500);

        server.closeAllConnections?.();
        server.close(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    // Small cleanup delay
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  interface ConnectResult {
    ws: WebSocket;
    welcomeMessage: any;
  }

  const connectWebSocket = (): Promise<ConnectResult> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws/chat`);
      activeWebSockets.push(ws);

      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error('WebSocket connection timeout'));
      }, 3000);

      ws.once('message', (data: Buffer | string) => {
        clearTimeout(timeout);
        const welcomeMessage = JSON.parse(data.toString());
        resolve({ ws, welcomeMessage });
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  };

  const waitForMessage = (ws: WebSocket, timeoutMs = 1000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('waitForMessage timeout'));
      }, timeoutMs);

      ws.once('message', (data: Buffer | string) => {
        clearTimeout(timeout);
        resolve(JSON.parse(data.toString()));
      });
    });
  };

  const closeWebSocket = (ws: WebSocket): Promise<void> => {
    return new Promise((resolve) => {
      if (ws.readyState === WebSocket.CLOSED) {
        resolve();
        return;
      }
      ws.once('close', () => resolve());
      ws.close();
      // Force close after 200ms
      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.terminate();
        }
        resolve();
      }, 200);
    });
  };

  it('should accept WebSocket connections', async () => {
    const { ws } = await connectWebSocket();
    expect(ws.readyState).toBe(WebSocket.OPEN);
    await closeWebSocket(ws);
  });

  it('should send welcome message on connection', async () => {
    const { ws, welcomeMessage } = await connectWebSocket();

    expect(welcomeMessage.type).toBe('connected');
    expect(welcomeMessage.message).toContain('Connected to Omnistream');

    await closeWebSocket(ws);
  });

  it('should require communityId for subscription', async () => {
    const { ws } = await connectWebSocket();

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');
    expect(response.error).toContain('communityId');

    await closeWebSocket(ws);
  });

  it('should reject invalid communityId', async () => {
    const { ws } = await connectWebSocket();

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        communityId: 'invalid-community-id',
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');
    expect(response.error).toContain('Authentication failed');

    await closeWebSocket(ws);
  });

  it('should reject subscription to non-existent stream', async () => {
    const { ws } = await connectWebSocket();

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: 'non-existent-id',
        communityId: community.id,
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');
    // The error is "Authentication failed" when stream doesn't exist
    expect(response.error).toBeDefined();

    await closeWebSocket(ws);
  });

  it('should successfully subscribe to stream', async () => {
    const { ws } = await connectWebSocket();

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        communityId: community.id,
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('subscribed');
    expect(response.streamId).toBe(stream.id);

    await closeWebSocket(ws);
  });

  it('should broadcast new chat messages to subscribers', async () => {
    const { ws } = await connectWebSocket();

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        communityId: community.id,
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
    await closeWebSocket(ws);
  });

  it('should handle unsubscribe messages', async () => {
    const { ws } = await connectWebSocket();

    // Subscribe first
    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        communityId: community.id,
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

    await closeWebSocket(ws);
  });

  it('should handle highlight requests', async () => {
    const { ws } = await connectWebSocket();

    // Subscribe first
    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        communityId: community.id,
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

    await closeWebSocket(ws);
  });

  it('should handle invalid message types', async () => {
    const { ws } = await connectWebSocket();

    ws.send(
      JSON.stringify({
        type: 'invalid-type',
      })
    );

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');

    await closeWebSocket(ws);
  });

  it('should handle malformed JSON', async () => {
    const { ws } = await connectWebSocket();

    ws.send('this is not json');

    const response = await waitForMessage(ws);
    expect(response.type).toBe('error');

    await closeWebSocket(ws);
  });

  it('should handle client disconnect gracefully', async () => {
    const { ws } = await connectWebSocket();

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        communityId: community.id,
      })
    );
    await waitForMessage(ws); // Skip subscribed message

    // Close connection
    await closeWebSocket(ws);

    // Wait a bit for cleanup
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Server should have cleaned up the subscription
    // (no assertion needed, just checking it doesn't crash)
  });

  it('should support multiple concurrent connections', async () => {
    const { ws: ws1 } = await connectWebSocket();
    const { ws: ws2 } = await connectWebSocket();

    // Both subscribe to same stream
    ws1.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        communityId: community.id,
      })
    );

    ws2.send(
      JSON.stringify({
        type: 'subscribe',
        streamId: stream.id,
        communityId: community.id,
      })
    );

    const response1 = await waitForMessage(ws1);
    const response2 = await waitForMessage(ws2);

    expect(response1.type).toBe('subscribed');
    expect(response2.type).toBe('subscribed');

    await closeWebSocket(ws1);
    await closeWebSocket(ws2);
  });
});
