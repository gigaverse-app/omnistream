/**
 * Unit tests for database
 */

import { db } from '../../../database/index.js';
import { Platform, StreamStatus } from '../../../core/interfaces.js';
import { NotFoundError } from '../../../core/errors.js';

describe('Database', () => {
  describe('Community operations', () => {
    it('should create a community', async () => {
      const community = await db.createCommunity('Test Community');

      expect(community.id).toBeDefined();
      expect(community.name).toBe('Test Community');
      expect(community.apiKey).toMatch(/^omni_/);
      expect(community.createdAt).toBeInstanceOf(Date);
    });

    it('should get community by ID', async () => {
      const created = await db.createCommunity('Test Community');
      const retrieved = await db.getCommunityById(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(created.name);
    });

    it('should get community by API key', async () => {
      const created = await db.createCommunity('Test Community');
      const retrieved = await db.getCommunityByApiKey(created.apiKey);

      expect(retrieved.id).toBe(created.id);
    });

    it('should throw NotFoundError for invalid community ID', async () => {
      await expect(db.getCommunityById('invalid-id')).rejects.toThrow(NotFoundError);
    });

    it('should list all communities', async () => {
      await db.createCommunity('Community 1');
      await db.createCommunity('Community 2');

      const communities = await db.listCommunities();

      expect(communities.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('OAuth token operations', () => {
    it('should save and retrieve OAuth tokens', async () => {
      const community = await db.createCommunity('Test Community');

      const tokens = {
        communityId: community.id,
        platform: Platform.YOUTUBE,
        tokens: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: new Date(Date.now() + 3600000),
          scope: ['youtube.force-ssl'],
        },
        updatedAt: new Date(),
      };

      await db.saveOAuthTokens(tokens);

      const retrieved = await db.getOAuthTokens(community.id, Platform.YOUTUBE);

      expect(retrieved.tokens.accessToken).toBe('test-token');
      expect(retrieved.tokens.refreshToken).toBe('test-refresh');
    });

    it('should throw NotFoundError for non-existent tokens', async () => {
      await expect(db.getOAuthTokens('invalid-id', Platform.YOUTUBE)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should delete OAuth tokens', async () => {
      const community = await db.createCommunity('Test Community');

      const tokens = {
        communityId: community.id,
        platform: Platform.YOUTUBE,
        tokens: {
          accessToken: 'test-token',
          expiresAt: new Date(Date.now() + 3600000),
          scope: ['youtube.force-ssl'],
        },
        updatedAt: new Date(),
      };

      await db.saveOAuthTokens(tokens);
      await db.deleteOAuthTokens(community.id, Platform.YOUTUBE);

      await expect(db.getOAuthTokens(community.id, Platform.YOUTUBE)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('Stream operations', () => {
    it('should create a stream', async () => {
      const community = await db.createCommunity('Test Community');

      const stream = await db.createStream({
        communityId: community.id,
        title: 'Test Stream',
        description: 'Test Description',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.YOUTUBE, Platform.FACEBOOK],
      });

      expect(stream.id).toBeDefined();
      expect(stream.title).toBe('Test Stream');
      expect(stream.platforms).toEqual([Platform.YOUTUBE, Platform.FACEBOOK]);
    });

    it('should get stream by ID', async () => {
      const community = await db.createCommunity('Test Community');
      const created = await db.createStream({
        communityId: community.id,
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.YOUTUBE],
      });

      const retrieved = await db.getStream(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe('Test Stream');
    });

    it('should update stream', async () => {
      const community = await db.createCommunity('Test Community');
      const stream = await db.createStream({
        communityId: community.id,
        title: 'Original Title',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.YOUTUBE],
      });

      const updated = await db.updateStream(stream.id, {
        title: 'Updated Title',
      });

      expect(updated.title).toBe('Updated Title');
    });

    it('should list streams by community', async () => {
      const community = await db.createCommunity('Test Community');

      await db.createStream({
        communityId: community.id,
        title: 'Stream 1',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'key1',
        platforms: [Platform.YOUTUBE],
      });

      await db.createStream({
        communityId: community.id,
        title: 'Stream 2',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'key2',
        platforms: [Platform.FACEBOOK],
      });

      const streams = await db.listStreamsByCommunity(community.id);

      expect(streams.length).toBe(2);
    });

    it('should delete stream', async () => {
      const community = await db.createCommunity('Test Community');
      const stream = await db.createStream({
        communityId: community.id,
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.YOUTUBE],
      });

      await db.deleteStream(stream.id);

      await expect(db.getStream(stream.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Platform stream operations', () => {
    it('should save and retrieve platform streams', async () => {
      const community = await db.createCommunity('Test Community');
      const stream = await db.createStream({
        communityId: community.id,
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.YOUTUBE],
      });

      const platformStream = {
        platform: Platform.YOUTUBE,
        platformStreamId: 'yt-123',
        status: StreamStatus.LIVE,
        viewerCount: 100,
      };

      await db.savePlatformStream(stream.id, platformStream);

      const retrieved = await db.getPlatformStream(stream.id, Platform.YOUTUBE);

      expect(retrieved).toBeDefined();
      expect(retrieved?.platformStreamId).toBe('yt-123');
      expect(retrieved?.viewerCount).toBe(100);
    });
  });

  describe('Chat message operations', () => {
    it('should save and retrieve chat messages', async () => {
      const community = await db.createCommunity('Test Community');
      const stream = await db.createStream({
        communityId: community.id,
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.YOUTUBE],
      });

      const message = {
        id: 'msg-1',
        streamId: stream.id,
        platform: Platform.YOUTUBE,
        authorId: 'user-123',
        authorName: 'Test User',
        message: 'Hello world!',
        timestamp: new Date(),
      };

      await db.saveChatMessage(message);

      const messages = await db.getChatMessages(stream.id);

      expect(messages.length).toBe(1);
      expect(messages[0].message).toBe('Hello world!');
    });

    it('should filter messages by timestamp', async () => {
      const community = await db.createCommunity('Test Community');
      const stream = await db.createStream({
        communityId: community.id,
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'stream-key',
        platforms: [Platform.YOUTUBE],
      });

      const oldMessage = {
        id: 'msg-1',
        streamId: stream.id,
        platform: Platform.YOUTUBE,
        authorId: 'user-123',
        authorName: 'Test User',
        message: 'Old message',
        timestamp: new Date(Date.now() - 10000),
      };

      const newMessage = {
        id: 'msg-2',
        streamId: stream.id,
        platform: Platform.YOUTUBE,
        authorId: 'user-123',
        authorName: 'Test User',
        message: 'New message',
        timestamp: new Date(),
      };

      await db.saveChatMessage(oldMessage);
      await db.saveChatMessage(newMessage);

      const since = new Date(Date.now() - 5000);
      const messages = await db.getChatMessages(stream.id, since);

      expect(messages.length).toBe(1);
      expect(messages[0].message).toBe('New message');
    });
  });
});
