/**
 * Unit tests for streams API routes
 */

import request from 'supertest';
import express from 'express';
import streamsRouter from '../../../api/routes/streams.js';
import { db } from '../../../database/index.js';
import { errorHandler } from '../../../api/middleware/error-handler.js';
import { Platform } from '../../../core/interfaces.js';

const app = express();
app.use(express.json());
app.use('/api/v1/streams', streamsRouter);
app.use(errorHandler);

describe('Streams API Routes', () => {
  let community: any;

  beforeEach(async () => {
    community = await db.createCommunity('Test Community');
  });

  describe('POST /api/v1/streams', () => {
    it('should return 400 without communityId', async () => {
      const response = await request(app)
        .post('/api/v1/streams')
        .send({
          title: 'Test Stream',
          rtmpUrl: 'rtmp://example.com',
          rtmpKey: 'key',
          platforms: ['youtube'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Community ID');
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/v1/streams')
        .send({
          communityId: community.id,
          rtmpUrl: 'rtmp://example.com',
          rtmpKey: 'key',
          platforms: ['youtube'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Title is required');
    });

    it('should return 400 if rtmpUrl is missing', async () => {
      const response = await request(app)
        .post('/api/v1/streams')
        .send({
          communityId: community.id,
          title: 'Test Stream',
          rtmpKey: 'key',
          platforms: ['youtube'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('RTMP URL is required');
    });

    it('should return 400 if rtmpKey is missing', async () => {
      const response = await request(app)
        .post('/api/v1/streams')
        .send({
          communityId: community.id,
          title: 'Test Stream',
          rtmpUrl: 'rtmp://example.com',
          platforms: ['youtube'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('RTMP key is required');
    });

    it('should return 400 if platforms is empty', async () => {
      const response = await request(app).post('/api/v1/streams').send({
        communityId: community.id,
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'key',
        platforms: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('At least one platform');
    });

    it('should create stream but fail on platform OAuth', async () => {
      const response = await request(app)
        .post('/api/v1/streams')
        .send({
          communityId: community.id,
          title: 'Test Stream',
          description: 'Test Description',
          rtmpUrl: 'rtmp://example.com',
          rtmpKey: 'key',
          platforms: ['youtube'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stream).toBeDefined();
      expect(response.body.data.stream.title).toBe('Test Stream');
    });
  });

  describe('GET /api/v1/streams', () => {
    it('should return 400 without communityId', async () => {
      const response = await request(app).get('/api/v1/streams');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('communityId');
    });

    it('should return empty array when no streams exist', async () => {
      const response = await request(app)
        .get('/api/v1/streams')
        .query({ communityId: community.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return streams for authenticated community', async () => {
      await db.createStream({
        communityId: community.id,
        title: 'Stream 1',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'key1',
        platforms: [Platform.YOUTUBE],
      });

      const response = await request(app)
        .get('/api/v1/streams')
        .query({ communityId: community.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Stream 1');
    });
  });

  describe('GET /api/v1/streams/:streamId', () => {
    it('should return 400 without communityId', async () => {
      const response = await request(app).get('/api/v1/streams/stream-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('communityId');
    });

    it('should return 404 for non-existent stream', async () => {
      const response = await request(app)
        .get('/api/v1/streams/non-existent-id')
        .query({ communityId: community.id });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return stream status for valid stream', async () => {
      const stream = await db.createStream({
        communityId: community.id,
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'key',
        platforms: [Platform.YOUTUBE],
      });

      const response = await request(app)
        .get(`/api/v1/streams/${stream.id}`)
        .query({ communityId: community.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stream).toBeDefined();
      expect(response.body.data.stream.id).toBe(stream.id);
    });
  });

  describe('DELETE /api/v1/streams/:streamId', () => {
    it('should return 400 without communityId', async () => {
      const response = await request(app).delete('/api/v1/streams/stream-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('communityId');
    });

    it('should return 404 for non-existent stream', async () => {
      const response = await request(app)
        .delete('/api/v1/streams/non-existent-id')
        .query({ communityId: community.id });

      expect(response.status).toBe(404);
    });

    it('should delete stream successfully', async () => {
      const stream = await db.createStream({
        communityId: community.id,
        title: 'Test Stream',
        rtmpUrl: 'rtmp://example.com',
        rtmpKey: 'key',
        platforms: [Platform.YOUTUBE],
      });

      const response = await request(app)
        .delete(`/api/v1/streams/${stream.id}`)
        .query({ communityId: community.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('deleted');

      // Verify it's deleted
      await expect(db.getStream(stream.id)).rejects.toThrow();
    });
  });
});
