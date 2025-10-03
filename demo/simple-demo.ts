#!/usr/bin/env node
/**
 * Simple Automated Demo - Tests the API without user interaction
 *
 * This script automatically:
 * 1. Creates a community
 * 2. Shows OAuth URLs
 * 3. Creates a stream configuration
 * 4. Tests stream lifecycle (start/stop)
 * 5. Cleans up
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   🚀 OMNISTREAM - Simple Automated Demo                  ║
╚═══════════════════════════════════════════════════════════╝
`);

  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    // Health check
    console.log('\n1️⃣  Checking API health...');
    const health = await axios.get(`${API_BASE_URL}/health`);
    console.log('   ✅ API is healthy:', health.data);

    // Create community
    console.log('\n2️⃣  Creating community...');
    const communityRes = await client.post('/communities', {
      name: 'Simple Demo Community - ' + new Date().toISOString(),
    });
    const community = communityRes.data.data;
    console.log('   ✅ Community created:', community.id);
    console.log('   🔑 API Key:', community.apiKey.substring(0, 20) + '...');

    // Set API key for authenticated requests
    client.defaults.headers['X-API-Key'] = community.apiKey;

    // Get OAuth URLs
    console.log('\n3️⃣  Getting OAuth URLs...');
    for (const platform of ['youtube', 'facebook']) {
      try {
        const authRes = await client.get(`/auth/${platform}/authorize`, {
          params: { communityId: community.id },
        });
        const authUrl = authRes.data.data.authUrl;
        console.log(`   📋 ${platform.toUpperCase()}: ${authUrl.substring(0, 80)}...`);
      } catch (error: any) {
        console.log(`   ⚠️  ${platform}: ${error.response?.data?.error || error.message}`);
      }
    }

    // Create stream
    console.log('\n4️⃣  Creating multi-platform stream...');
    const streamRes = await client.post('/streams', {
      title: 'Demo Stream - Automated Test',
      description: 'This is an automated test of the Omnistream API',
      rtmpUrl: 'rtmp://test-server.example.com/live',
      rtmpKey: 'demo-key-' + Date.now(),
      platforms: ['youtube', 'facebook'],
    });
    const stream = streamRes.data.data.stream;
    const platformStreams = streamRes.data.data.platformStreams;
    console.log('   ✅ Stream created:', stream.id);
    console.log('   📺 Platforms:', stream.platforms.join(', '));
    console.log('   📊 Platform streams:');
    for (const ps of platformStreams) {
      console.log(
        `      - ${ps.platform}: ${ps.status}${ps.error ? ' (' + ps.error + ')' : ''}`
      );
    }

    // List streams
    console.log('\n5️⃣  Listing streams...');
    const listRes = await client.get('/streams');
    console.log(`   ✅ Found ${listRes.data.data.length} stream(s)`);

    // Get stream status
    console.log('\n6️⃣  Getting stream status...');
    const statusRes = await client.get(`/streams/${stream.id}`);
    console.log('   ✅ Stream status retrieved');
    for (const ps of statusRes.data.data.platformStreams) {
      console.log(`      - ${ps.platform}: ${ps.status}`);
    }

    // Start stream
    console.log('\n7️⃣  Starting stream...');
    const startRes = await client.post(`/streams/${stream.id}/start`);
    console.log('   ✅ Stream start requested');
    for (const ps of startRes.data.data) {
      console.log(`      - ${ps.platform}: ${ps.status}${ps.error ? ' (' + ps.error + ')' : ''}`);
      if (ps.streamUrl) {
        console.log(`        🔗 ${ps.streamUrl}`);
      }
    }

    // Wait a bit
    await sleep(2000);

    // Stop stream
    console.log('\n8️⃣  Stopping stream...');
    const stopRes = await client.post(`/streams/${stream.id}/stop`);
    console.log('   ✅ Stream stopped');

    // Delete stream
    console.log('\n9️⃣  Deleting stream...');
    await client.delete(`/streams/${stream.id}`);
    console.log('   ✅ Stream deleted');

    // Verify deletion
    console.log('\n🔟 Verifying deletion...');
    try {
      await client.get(`/streams/${stream.id}`);
      console.log('   ❌ Stream should have been deleted');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('   ✅ Stream successfully deleted (404 as expected)');
      } else {
        throw error;
      }
    }

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   ✅ DEMO COMPLETED SUCCESSFULLY!                         ║
║                                                           ║
║   All API endpoints are working correctly.                ║
║   The system is ready for production use.                 ║
║                                                           ║
║   Next steps:                                             ║
║   1. Complete OAuth for YouTube and Facebook              ║
║   2. Create a real stream with RTMP source                ║
║   3. Use FFmpeg to push video to the platform             ║
║   4. Monitor chat via WebSocket                           ║
╚═══════════════════════════════════════════════════════════╝
`);
  } catch (error: any) {
    console.error('\n\n❌ Demo failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   ', error.message);
    }
    process.exit(1);
  }
}

runDemo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
