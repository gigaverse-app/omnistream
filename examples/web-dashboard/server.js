const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 4000;
const OMNISTREAM_API_URL = process.env.OMNISTREAM_API_URL || 'http://localhost:3000';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// In-memory session storage (for demo purposes)
const sessions = new Map();

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    omnistreamUrl: OMNISTREAM_API_URL,
  });
});

// API proxy endpoints to avoid CORS issues

// Create a new community (registration)
app.post('/api/communities', async (req, res) => {
  try {
    const response = await axios.post(`${OMNISTREAM_API_URL}/api/v1/communities`, req.body);
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to create community', success: false });
  }
});

// List all communities
app.get('/api/communities', async (req, res) => {
  try {
    const response = await axios.get(`${OMNISTREAM_API_URL}/api/v1/communities`);
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to fetch communities', success: false });
  }
});

// Get community info by API key (used for profile display)
app.get('/api/community', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    // List all communities and find the one with matching API key
    const response = await axios.get(`${OMNISTREAM_API_URL}/api/v1/communities`);
    const communities = response.data.data || [];
    const community = communities.find((c) => c.apiKey === apiKey);

    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    res.json({ success: true, data: community });
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to fetch community', success: false });
  }
});

// Get OAuth status for platforms
app.get('/api/platforms', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    // Get community info
    const communitiesResponse = await axios.get(`${OMNISTREAM_API_URL}/api/v1/communities`);
    const communities = communitiesResponse.data.data || [];
    const community = communities.find((c) => c.apiKey === apiKey);

    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    // Return platform info with OAuth URLs
    const platforms = [
      {
        name: 'youtube',
        displayName: 'YouTube',
        connected: false, // Will be determined by OAuth tokens in real implementation
        authUrl: `${OMNISTREAM_API_URL}/api/v1/auth/youtube/callback?communityId=${community.id}`,
      },
      {
        name: 'facebook',
        displayName: 'Facebook',
        connected: false,
        authUrl: `${OMNISTREAM_API_URL}/api/v1/auth/facebook/callback?communityId=${community.id}`,
      },
      {
        name: 'tiktok',
        displayName: 'TikTok',
        connected: false,
        authUrl: `${OMNISTREAM_API_URL}/api/v1/auth/tiktok/callback?communityId=${community.id}`,
      },
    ];

    res.json({ success: true, platforms });
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to fetch platforms', success: false });
  }
});

// Get OAuth authorization URL
app.get('/api/auth/:platform/authorize', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    // Get community info
    const communitiesResponse = await axios.get(`${OMNISTREAM_API_URL}/api/v1/communities`);
    const communities = communitiesResponse.data.data || [];
    const community = communities.find((c) => c.apiKey === apiKey);

    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const response = await axios.get(
      `${OMNISTREAM_API_URL}/api/v1/auth/${req.params.platform}/authorize`,
      {
        params: { communityId: community.id },
      }
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to get auth URL', success: false });
  }
});

app.post('/api/streams', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const response = await axios.post(`${OMNISTREAM_API_URL}/api/v1/streams`, req.body, {
      headers: { 'x-api-key': apiKey },
    });
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to create stream' });
  }
});

app.get('/api/streams', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const response = await axios.get(`${OMNISTREAM_API_URL}/api/v1/streams`, {
      headers: { 'x-api-key': apiKey },
    });
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to fetch streams' });
  }
});

app.get('/api/streams/:streamId', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const response = await axios.get(
      `${OMNISTREAM_API_URL}/api/v1/streams/${req.params.streamId}`,
      {
        headers: { 'x-api-key': apiKey },
      }
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to fetch stream' });
  }
});

app.post('/api/streams/:streamId/start', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const response = await axios.post(
      `${OMNISTREAM_API_URL}/api/v1/streams/${req.params.streamId}/start`,
      req.body,
      {
        headers: { 'x-api-key': apiKey },
      }
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to start stream' });
  }
});

app.post('/api/streams/:streamId/stop', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const response = await axios.post(
      `${OMNISTREAM_API_URL}/api/v1/streams/${req.params.streamId}/stop`,
      {},
      {
        headers: { 'x-api-key': apiKey },
      }
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to stop stream' });
  }
});

app.delete('/api/streams/:streamId', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const response = await axios.delete(
      `${OMNISTREAM_API_URL}/api/v1/streams/${req.params.streamId}`,
      {
        headers: { 'x-api-key': apiKey },
      }
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: 'Failed to delete stream' });
  }
});

// OAuth callback handler
app.get('/oauth/callback', (req, res) => {
  const { platform, code, state } = req.query;
  res.render('oauth-callback', { platform, code, state });
});

app.listen(PORT, () => {
  console.log(`🌐 Omnistream Web Dashboard running at http://localhost:${PORT}`);
  console.log(`📡 Connected to Omnistream API at ${OMNISTREAM_API_URL}`);
});
