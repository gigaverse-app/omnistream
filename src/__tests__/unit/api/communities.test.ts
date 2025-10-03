/**
 * Unit tests for communities API routes
 */

import request from 'supertest';
import express from 'express';
import communitiesRouter from '../../../api/routes/communities.js';
import { db } from '../../../database/index.js';
import { errorHandler } from '../../../api/middleware/error-handler.js';

const app = express();
app.use(express.json());
app.use('/api/v1/communities', communitiesRouter);
app.use(errorHandler);

describe('Communities API Routes', () => {
  describe('POST /api/v1/communities', () => {
    it('should create a new community with valid name', async () => {
      const response = await request(app)
        .post('/api/v1/communities')
        .send({ name: 'Test Community' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Community');
      expect(response.body.data.apiKey).toMatch(/^omni_/);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/v1/communities')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('name is required');
    });

    it('should return 400 if name is not a string', async () => {
      const response = await request(app)
        .post('/api/v1/communities')
        .send({ name: 123 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if name is empty string', async () => {
      const response = await request(app)
        .post('/api/v1/communities')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/communities', () => {
    it('should return empty array when no communities exist', async () => {
      const response = await request(app)
        .get('/api/v1/communities');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return all communities', async () => {
      // Create test communities
      await db.createCommunity('Community 1');
      await db.createCommunity('Community 2');

      const response = await request(app)
        .get('/api/v1/communities');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return communities with all required fields', async () => {
      await db.createCommunity('Test Community');

      const response = await request(app)
        .get('/api/v1/communities');

      expect(response.status).toBe(200);
      const community = response.body.data[response.body.data.length - 1];
      expect(community).toHaveProperty('id');
      expect(community).toHaveProperty('name');
      expect(community).toHaveProperty('apiKey');
      expect(community).toHaveProperty('createdAt');
      expect(community).toHaveProperty('updatedAt');
    });
  });
});
