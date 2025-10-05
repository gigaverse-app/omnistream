# Gigaverse Integration Guide for Omnistream

**Comprehensive integration manual for Gigaverse frontend and backend teams**

This guide explains how to integrate Omnistream into Gigaverse to enable multi-platform livestreaming (YouTube, Facebook, TikTok, Instagram) where each community maintains separate OAuth credentials.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Integration](#backend-integration)
3. [Frontend Integration](#frontend-integration)
4. [OAuth Flow: The "Song and Dance"](#oauth-flow-the-song-and-dance)
5. [Complete Integration Examples](#complete-integration-examples)
6. [Security & Best Practices](#security--best-practices)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         Gigaverse Frontend                      │
│  (Creates streams, manages OAuth, displays chat)                │
└────────────┬───────────────────────────────────┬────────────────┘
             │                                   │
             │ REST API                          │ WebSocket
             │ (Create streams,                  │ (Real-time chat)
             │  OAuth URLs)                      │
             │                                   │
┌────────────▼───────────────────────────────────▼────────────────┐
│                      Omnistream Server                          │
│  • Manages OAuth tokens per community                           │
│  • Creates streams on YouTube/Facebook/TikTok                   │
│  • Aggregates chat from all platforms                           │
│  • Handles token refresh automatically                          │
└────────┬────────────────┬────────────────┬────────────────┬─────┘
         │                │                │                │
         │ YouTube API    │ Facebook API   │ TikTok API     │ (Future)
         │                │                │                │ Instagram
         ▼                ▼                ▼                ▼
   ┌─────────┐      ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ YouTube │      │ Facebook │    │  TikTok  │    │Instagram │
   └─────────┘      └──────────┘    └──────────┘    └──────────┘
```

### Key Concepts

1. **Community**: Each Gigaverse community gets its own Omnistream community ID and API key
2. **OAuth Credentials**: Each community connects their own YouTube, Facebook, TikTok accounts via OAuth
3. **Credential Storage**: OAuth tokens are stored in Omnistream's database, associated with community ID
4. **RTMP Source**: Gigaverse creates RTMP streams on its own servers; Omnistream tells platforms to pull from that RTMP URL
5. **Multi-Platform Streaming**: One API call creates streams on multiple platforms simultaneously

---

## Backend Integration

### 1. Deploy Omnistream Server

#### Prerequisites

- Node.js 18+
- PostgreSQL database (or use in-memory for development)
- Domain name with SSL certificate

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/omnistream.git
cd omnistream

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

#### Environment Configuration

Edit `.env` with your settings:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
BASE_URL=https://omnistream.gigaverse.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/omnistream

# Security
API_KEY_SALT=your_random_32_char_salt_here
JWT_SECRET=your_random_jwt_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# YouTube OAuth App Credentials
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=https://omnistream.gigaverse.com/api/v1/auth/youtube/callback

# Facebook OAuth App Credentials
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://omnistream.gigaverse.com/api/v1/auth/facebook/callback

# TikTok OAuth App Credentials (requires LIVE Access API approval)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://omnistream.gigaverse.com/api/v1/auth/tiktok/callback
```

#### Build and Start

```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start dist/index.js --name omnistream
```

---

### 2. Obtain OAuth Credentials from Platforms

#### YouTube (Google Cloud Console)

**Step 1**: Go to [Google Cloud Console](https://console.cloud.google.com/)

**Step 2**: Create a new project or select existing

- Click "Select a project" → "New Project"
- Name: "Gigaverse Omnistream"

**Step 3**: Enable YouTube Data API v3

- Go to "APIs & Services" → "Library"
- Search for "YouTube Data API v3"
- Click "Enable"

**Step 4**: Create OAuth 2.0 Credentials

- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth client ID"
- Application type: "Web application"
- Name: "Omnistream"
- Authorized redirect URIs:
  - `https://omnistream.gigaverse.com/api/v1/auth/youtube/callback`
  - `http://localhost:3000/api/v1/auth/youtube/callback` (for development)

**Step 5**: Copy credentials

- Copy the **Client ID** → Put in `YOUTUBE_CLIENT_ID`
- Copy the **Client Secret** → Put in `YOUTUBE_CLIENT_SECRET`

**Required Scopes** (already configured in code):

- `https://www.googleapis.com/auth/youtube.force-ssl`
- `https://www.googleapis.com/auth/youtube.readonly`

---

#### Facebook (Meta for Developers)

**Step 1**: Go to [Facebook for Developers](https://developers.facebook.com/)

**Step 2**: Create a new app

- Click "My Apps" → "Create App"
- Use case: "Other"
- App type: "Business"
- Display name: "Gigaverse Omnistream"

**Step 3**: Add Facebook Login product

- From app dashboard, click "Add Product"
- Find "Facebook Login" → Click "Set Up"

**Step 4**: Configure OAuth redirect URIs

- Go to "Facebook Login" → "Settings"
- Valid OAuth Redirect URIs:
  - `https://omnistream.gigaverse.com/api/v1/auth/facebook/callback`
  - `http://localhost:3000/api/v1/auth/facebook/callback`

**Step 5**: Get App ID and Secret

- Go to "Settings" → "Basic"
- Copy **App ID** → Put in `FACEBOOK_APP_ID`
- Copy **App Secret** → Put in `FACEBOOK_APP_SECRET`

**Step 6**: Request Advanced Access (for production)

- Go to "App Review" → "Permissions and Features"
- Request access for:
  - `pages_manage_posts` (required)
  - `pages_read_engagement` (for chat)
  - `pages_manage_engagement` (for chat)

**Important Notes**:

- Your app starts in "Development Mode" - only admins/developers/testers can use it
- You need to submit for "App Review" to make it public
- Users must have a Facebook Page to stream (personal profiles can't go live via API)

---

#### TikTok (TikTok for Developers)

**⚠️ Important**: TikTok LIVE Access API requires special approval and is not generally available.

**Step 1**: Apply for API access

- Go to [TikTok for Developers](https://developers.tiktok.com/)
- Register as a developer
- Apply for LIVE Access API access

**Step 2**: Create an app (after approval)

- Create a new application
- Select "LIVE Access" product

**Step 3**: Configure redirect URI

- In app settings, add redirect URI:
  - `https://omnistream.gigaverse.com/api/v1/auth/tiktok/callback`

**Step 4**: Get credentials

- Copy **Client Key** → Put in `TIKTOK_CLIENT_KEY`
- Copy **Client Secret** → Put in `TIKTOK_CLIENT_SECRET`

**Required Scopes**:

- `live.room.info`
- `live.room.manage`

**Note**: Most developers will not have access to TikTok LIVE API. You can still deploy Omnistream and use YouTube/Facebook while TikTok approval is pending.

---

#### Instagram

**⚠️ Status**: Instagram does not provide a public API for live streaming.

**Current Options**:

1. **Instagram Live API** - Only available to select partners (e.g., StreamYard, Restream)
2. **Third-party streaming tools** - Use RTMP ingest via unofficial methods (not recommended for production)
3. **Manual streaming** - Users can stream via Instagram app using RTMP URL from Gigaverse

**Recommendation**: Do not advertise Instagram support until official API access is obtained.

---

### 3. Gigaverse Backend Database Schema

Your backend should store Omnistream-related data:

#### Communities Table

```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  gigaverse_user_id UUID REFERENCES users(id),

  -- Omnistream integration
  omnistream_community_id UUID NOT NULL,
  omnistream_api_key VARCHAR(255) NOT NULL,

  -- Track which platforms are connected
  connected_platforms JSONB DEFAULT '[]',
  -- Example: ["youtube", "facebook"]

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_communities_omnistream_id ON communities(omnistream_community_id);
```

#### Streams Table

```sql
CREATE TABLE streams (
  id UUID PRIMARY KEY,
  community_id UUID REFERENCES communities(id),

  -- Stream details
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- RTMP source (from Gigaverse RTMP server)
  rtmp_url VARCHAR(500) NOT NULL,
  rtmp_key VARCHAR(255) NOT NULL,

  -- Omnistream integration
  omnistream_stream_id UUID NOT NULL,

  -- Platform-specific stream info (stored as JSON)
  platform_streams JSONB DEFAULT '[]',
  -- Example: [
  --   {"platform": "youtube", "streamUrl": "...", "status": "live"},
  --   {"platform": "facebook", "streamUrl": "...", "status": "live"}
  -- ]

  status VARCHAR(50) DEFAULT 'scheduled',
  -- Values: scheduled, live, ended, error

  scheduled_start_time TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_streams_community ON streams(community_id);
CREATE INDEX idx_streams_omnistream_id ON streams(omnistream_stream_id);
```

---

### 4. Gigaverse Backend API Endpoints

Create these endpoints in your backend:

#### POST `/api/communities/:communityId/platforms/connect`

Start OAuth flow for a platform.

```typescript
// Example implementation (Node.js/Express)
app.post('/api/communities/:communityId/platforms/connect', async (req, res) => {
  const { communityId } = req.params;
  const { platform } = req.body; // 'youtube' | 'facebook' | 'tiktok'

  // Get community from your database
  const community = await db.getCommunity(communityId);

  // Call Omnistream to get OAuth URL
  const response = await fetch(
    `https://omnistream.gigaverse.com/api/v1/auth/${platform}/authorize?communityId=${community.omnistream_community_id}`
  );

  const { data } = await response.json();

  res.json({
    authUrl: data.authUrl,
    platform: data.platform,
  });
});
```

#### POST `/api/communities/:communityId/platforms/:platform/disconnect`

Revoke OAuth for a platform.

```typescript
app.post('/api/communities/:communityId/platforms/:platform/disconnect', async (req, res) => {
  const { communityId, platform } = req.params;

  const community = await db.getCommunity(communityId);

  // Call Omnistream to revoke tokens
  await fetch(
    `https://omnistream.gigaverse.com/api/v1/auth/${platform}?communityId=${community.omnistream_community_id}`,
    {
      method: 'DELETE',
    }
  );

  // Update your database
  await db.updateCommunity(communityId, {
    connected_platforms: community.connected_platforms.filter((p) => p !== platform),
  });

  res.json({ success: true });
});
```

#### POST `/api/streams/create`

Create a multi-platform stream.

```typescript
app.post('/api/streams/create', async (req, res) => {
  const { communityId, title, description, platforms } = req.body;

  // Get community
  const community = await db.getCommunity(communityId);

  // Generate RTMP credentials for this stream (from your RTMP server)
  const rtmpUrl = 'rtmp://live.gigaverse.com/live';
  const rtmpKey = generateStreamKey(); // Your implementation

  // Create stream in Omnistream
  const omnistreamResponse = await fetch('https://omnistream.gigaverse.com/api/v1/streams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': community.omnistream_api_key,
    },
    body: JSON.stringify({
      title,
      description,
      rtmpUrl,
      rtmpKey,
      platforms, // ['youtube', 'facebook']
    }),
  });

  const { data } = await omnistreamResponse.json();

  // Save stream to your database
  const stream = await db.createStream({
    community_id: communityId,
    title,
    description,
    rtmp_url: rtmpUrl,
    rtmp_key: rtmpKey,
    omnistream_stream_id: data.stream.id,
    platform_streams: data.platformStreams,
    status: 'scheduled',
  });

  res.json({
    stream,
    platformStreams: data.platformStreams,
    rtmpUrl,
    rtmpKey,
  });
});
```

#### POST `/api/streams/:streamId/start`

Start a stream on all platforms.

```typescript
app.post('/api/streams/:streamId/start', async (req, res) => {
  const { streamId } = req.params;

  const stream = await db.getStream(streamId);
  const community = await db.getCommunity(stream.community_id);

  // Start stream in Omnistream
  const response = await fetch(
    `https://omnistream.gigaverse.com/api/v1/streams/${stream.omnistream_stream_id}/start`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': community.omnistream_api_key,
      },
    }
  );

  const { data } = await response.json();

  // Update stream status
  await db.updateStream(streamId, {
    status: 'live',
    started_at: new Date(),
    platform_streams: data,
  });

  res.json({ success: true, platformStreams: data });
});
```

#### POST `/api/streams/:streamId/stop`

Stop a stream.

```typescript
app.post('/api/streams/:streamId/stop', async (req, res) => {
  const { streamId } = req.params;

  const stream = await db.getStream(streamId);
  const community = await db.getCommunity(stream.community_id);

  // Stop stream in Omnistream
  await fetch(
    `https://omnistream.gigaverse.com/api/v1/streams/${stream.omnistream_stream_id}/stop`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': community.omnistream_api_key,
      },
    }
  );

  // Update stream status
  await db.updateStream(streamId, {
    status: 'ended',
    ended_at: new Date(),
  });

  res.json({ success: true });
});
```

---

## Frontend Integration

### 1. Community Setup (One-time)

When a user creates a community in Gigaverse, create an Omnistream community:

```typescript
// In your community creation flow
async function createCommunity(name: string, userId: string) {
  // 1. Create community in Omnistream
  const omnistreamResponse = await fetch('https://omnistream.gigaverse.com/api/v1/communities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  const { data } = await omnistreamResponse.json();

  // 2. Save to your database
  const community = await yourBackend.createCommunity({
    name,
    gigaverse_user_id: userId,
    omnistream_community_id: data.id,
    omnistream_api_key: data.apiKey, // Store securely!
    connected_platforms: [],
  });

  return community;
}
```

**Security Note**: Never expose `omnistream_api_key` to the frontend. All Omnistream API calls should go through your backend.

---

### 2. Connect Social Media Platforms

#### UI Component: Platform Connection

```tsx
import { useState } from 'react';

interface Platform {
  id: 'youtube' | 'facebook' | 'tiktok';
  name: string;
  icon: string;
  connected: boolean;
}

function PlatformConnections({ communityId }: { communityId: string }) {
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'youtube', name: 'YouTube', icon: '/icons/youtube.svg', connected: false },
    { id: 'facebook', name: 'Facebook', icon: '/icons/facebook.svg', connected: false },
    { id: 'tiktok', name: 'TikTok', icon: '/icons/tiktok.svg', connected: false },
  ]);

  const handleConnect = async (platformId: string) => {
    // 1. Get OAuth URL from your backend
    const response = await fetch(`/api/communities/${communityId}/platforms/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: platformId }),
    });

    const { authUrl } = await response.json();

    // 2. Open OAuth in popup
    const popup = window.open(authUrl, 'oauth', 'width=600,height=700,scrollbars=yes');

    // 3. Listen for success message
    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'oauth-success' && event.data.platform === platformId) {
        // Update UI
        setPlatforms(platforms.map((p) => (p.id === platformId ? { ...p, connected: true } : p)));

        // Close popup
        popup?.close();

        // Clean up listener
        window.removeEventListener('message', messageHandler);
      }
    };

    window.addEventListener('message', messageHandler);
  };

  const handleDisconnect = async (platformId: string) => {
    if (!confirm(`Disconnect ${platformId}?`)) return;

    await fetch(`/api/communities/${communityId}/platforms/${platformId}/disconnect`, {
      method: 'POST',
    });

    setPlatforms(platforms.map((p) => (p.id === platformId ? { ...p, connected: false } : p)));
  };

  return (
    <div className="platform-connections">
      <h2>Connected Platforms</h2>
      {platforms.map((platform) => (
        <div key={platform.id} className="platform-card">
          <img src={platform.icon} alt={platform.name} />
          <h3>{platform.name}</h3>
          {platform.connected ? (
            <button onClick={() => handleDisconnect(platform.id)}>Disconnect</button>
          ) : (
            <button onClick={() => handleConnect(platform.id)}>Connect</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### 3. Create and Start Stream

```tsx
import { useState } from 'react';

interface StreamFormData {
  title: string;
  description: string;
  platforms: string[];
}

function StreamCreator({ communityId }: { communityId: string }) {
  const [formData, setFormData] = useState<StreamFormData>({
    title: '',
    description: '',
    platforms: [],
  });

  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);

  const handleCreateStream = async () => {
    // 1. Create stream
    const response = await fetch('/api/streams/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communityId,
        ...formData,
      }),
    });

    const data = await response.json();
    setStreamInfo(data);

    // 2. Show RTMP credentials to user
    alert(`Stream created! Use these RTMP settings in OBS:
      URL: ${data.rtmpUrl}
      Stream Key: ${data.rtmpKey}
    `);
  };

  const handleGoLive = async () => {
    if (!streamInfo) return;

    // Start stream on all platforms
    await fetch(`/api/streams/${streamInfo.stream.id}/start`, {
      method: 'POST',
    });

    setIsLive(true);
  };

  const handleEndStream = async () => {
    if (!streamInfo) return;

    await fetch(`/api/streams/${streamInfo.stream.id}/stop`, {
      method: 'POST',
    });

    setIsLive(false);
  };

  return (
    <div className="stream-creator">
      <h2>Create Stream</h2>

      <input
        type="text"
        placeholder="Stream title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <div className="platform-selector">
        <h3>Select Platforms</h3>
        {['youtube', 'facebook', 'tiktok'].map((platform) => (
          <label key={platform}>
            <input
              type="checkbox"
              checked={formData.platforms.includes(platform)}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData({
                    ...formData,
                    platforms: [...formData.platforms, platform],
                  });
                } else {
                  setFormData({
                    ...formData,
                    platforms: formData.platforms.filter((p) => p !== platform),
                  });
                }
              }}
            />
            {platform}
          </label>
        ))}
      </div>

      {!streamInfo && (
        <button
          onClick={handleCreateStream}
          disabled={!formData.title || formData.platforms.length === 0}
        >
          Create Stream
        </button>
      )}

      {streamInfo && !isLive && <button onClick={handleGoLive}>Go Live!</button>}

      {isLive && <button onClick={handleEndStream}>End Stream</button>}

      {streamInfo && (
        <div className="stream-links">
          <h3>Stream URLs:</h3>
          {streamInfo.platformStreams.map((ps: any) => (
            <a key={ps.platform} href={ps.streamUrl} target="_blank" rel="noopener">
              {ps.platform}: {ps.streamUrl}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 4. Real-time Chat Integration

```tsx
import { useEffect, useState } from 'react';

interface ChatMessage {
  id: string;
  platform: string;
  authorName: string;
  authorImageUrl?: string;
  message: string;
  timestamp: string;
  highlighted: boolean;
}

function LiveChat({ streamId, apiKey }: { streamId: string; apiKey: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket('wss://omnistream.gigaverse.com/ws/chat');

    websocket.onopen = () => {
      // Subscribe to stream
      websocket.send(
        JSON.stringify({
          type: 'subscribe',
          streamId,
          apiKey,
        })
      );
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'messageHighlighted') {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === data.messageId ? { ...msg, highlighted: true } : msg))
        );
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    // Cleanup
    return () => {
      websocket.send(JSON.stringify({ type: 'unsubscribe' }));
      websocket.close();
    };
  }, [streamId, apiKey]);

  const handleHighlight = (messageId: string, platform: string) => {
    ws?.send(
      JSON.stringify({
        type: 'highlight',
        messageId,
        platform,
      })
    );
  };

  return (
    <div className="live-chat">
      <h3>Live Chat</h3>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.highlighted ? 'highlighted' : ''}`}>
            {msg.authorImageUrl && <img src={msg.authorImageUrl} alt={msg.authorName} />}
            <div className="content">
              <div className="header">
                <span className="author">{msg.authorName}</span>
                <span className="platform">{msg.platform}</span>
              </div>
              <p>{msg.message}</p>
            </div>
            <button onClick={() => handleHighlight(msg.id, msg.platform)}>⭐ Highlight</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## OAuth Flow: The "Song and Dance"

### How OAuth Works for Each Platform

OAuth is a "dance" between 4 parties:

1. **User** (Gigaverse community owner)
2. **Your App** (Gigaverse frontend)
3. **Omnistream** (Your middleware)
4. **Platform** (YouTube, Facebook, TikTok)

Here's the step-by-step flow:

```
┌──────────┐         ┌───────────┐         ┌────────────┐         ┌──────────┐
│   User   │         │ Gigaverse │         │ Omnistream │         │ YouTube  │
└────┬─────┘         └─────┬─────┘         └──────┬─────┘         └────┬─────┘
     │                     │                      │                    │
     │ 1. Click "Connect  │                      │                    │
     │    YouTube"        │                      │                    │
     ├──────────────────> │                      │                    │
     │                    │                      │                    │
     │                    │ 2. GET /auth/youtube/│                    │
     │                    │    authorize?        │                    │
     │                    │    communityId=123   │                    │
     │                    ├────────────────────> │                    │
     │                    │                      │                    │
     │                    │ 3. Returns OAuth URL │                    │
     │                    │ <──────────────────  │                    │
     │                    │                      │                    │
     │ 4. Redirect to     │                      │                    │
     │    YouTube OAuth   │                      │                    │
     │    ─────────────────────────────────────────────────────────> │
     │                    │                      │                    │
     │ 5. User logs in    │                      │                    │
     │    and approves    │                      │                    │
     │ <──────────────────────────────────────────────────────────── │
     │                    │                      │                    │
     │                    │                      │ 6. Callback with   │
     │                    │                      │    code=ABC        │
     │                    │                      │ <─────────────────│
     │                    │                      │                    │
     │                    │                      │ 7. Exchange code   │
     │                    │                      │    for tokens      │
     │                    │                      │ ─────────────────>│
     │                    │                      │                    │
     │                    │                      │ 8. Access token +  │
     │                    │                      │    refresh token   │
     │                    │                      │ <─────────────────│
     │                    │                      │                    │
     │                    │                      │ 9. Save tokens     │
     │                    │                      │    to database     │
     │                    │                      │    (community_id:  │
     │                    │                      │     youtube)       │
     │                    │                      │                    │
     │ 10. Shows success  │                      │                    │
     │     page           │                      │                    │
     │ <──────────────────────────────────────── │                    │
     │                    │                      │                    │
     │ 11. Close popup    │                      │                    │
     │ ─────────────────> │                      │                    │
     │                    │                      │                    │
```

### Where Credentials Live

#### Omnistream Server (.env file)

```bash
# YouTube OAuth Application Credentials
YOUTUBE_CLIENT_ID=123456.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=secret_abc123

# These are the credentials for the Omnistream OAuth APP itself
# NOT the user's credentials
```

#### Omnistream Database

```
community_oauth_tokens table:
┌──────────────┬──────────┬──────────────┬───────────────┬────────────┐
│ community_id │ platform │ access_token │ refresh_token │ expires_at │
├──────────────┼──────────┼──────────────┼───────────────┼────────────┤
│ uuid-123     │ youtube  │ ya29.a0...   │ 1//0gH...     │ 2025-10-04 │
│ uuid-123     │ facebook │ EAABw...     │ NULL          │ 2025-12-01 │
│ uuid-456     │ youtube  │ ya29.b1...   │ 1//1xY...     │ 2025-10-04 │
└──────────────┴──────────┴──────────────┴───────────────┴────────────┘

# Each community has separate OAuth tokens for each platform
# Tokens are refreshed automatically by Omnistream
```

#### Gigaverse Database

```sql
-- You only store:
communities table:
┌────────┬──────────────────────┬──────────────────┬──────────────────────┐
│ id     │ omnistream_community │ omnistream_api   │ connected_platforms  │
│        │ _id                  │ _key             │                      │
├────────┼──────────────────────┼──────────────────┼──────────────────────┤
│ uuid-1 │ uuid-123             │ omni_abc123...   │ ["youtube","fb"]     │
│ uuid-2 │ uuid-456             │ omni_def456...   │ ["youtube"]          │
└────────┴──────────────────────┴──────────────────┴──────────────────────┘

# You DON'T store OAuth tokens - Omnistream handles that
# You only store the API key to make requests to Omnistream
```

### Token Refresh Handling

Omnistream automatically refreshes tokens when they expire:

```typescript
// Inside Omnistream (you don't need to implement this)
async function ensureFreshToken(communityId: string, platform: Platform): Promise<OAuthToken> {
  const tokenData = await db.getOAuthTokens(communityId, platform);

  // Check if token is expired or expiring soon
  const expiresIn = tokenData.tokens.expiresAt.getTime() - Date.now();
  const isExpired = expiresIn < 5 * 60 * 1000; // Less than 5 minutes

  if (isExpired && tokenData.tokens.refreshToken) {
    // Automatically refresh
    const provider = providerRegistry.getProvider(platform);
    const newTokens = await provider.refreshTokens(tokenData.tokens.refreshToken);

    // Save new tokens
    await db.saveOAuthTokens({
      communityId,
      platform,
      tokens: newTokens,
      updatedAt: new Date(),
    });

    return newTokens;
  }

  return tokenData.tokens;
}
```

**What this means for you**: You never have to worry about token expiration. Just make API calls to Omnistream, and it handles tokens automatically.

---

## Complete Integration Examples

### Example 1: Full Stream Lifecycle

```typescript
// User journey: Connect platform → Create stream → Go live → End stream

async function fullStreamLifecycle() {
  // 1. Create community (one-time setup)
  const community = await createOmnistreamCommunity('My Community');

  // 2. Connect YouTube
  const authUrl = await getYouTubeAuthUrl(community.id);
  // User completes OAuth...

  // 3. Create stream
  const stream = await createMultiPlatformStream({
    communityId: community.id,
    title: 'My First Stream',
    description: 'Testing multi-platform streaming',
    platforms: ['youtube', 'facebook'],
  });

  console.log('Use these RTMP settings in OBS:');
  console.log('URL:', stream.rtmpUrl);
  console.log('Key:', stream.rtmpKey);

  // 4. User configures OBS and starts streaming to RTMP
  // ...

  // 5. Start stream on platforms
  await startStream(stream.id);

  console.log('Now live on:');
  stream.platformStreams.forEach((ps) => {
    console.log(`- ${ps.platform}: ${ps.streamUrl}`);
  });

  // 6. Monitor chat
  const chat = connectToChat(stream.id, community.apiKey);
  chat.on('message', (msg) => {
    console.log(`[${msg.platform}] ${msg.authorName}: ${msg.message}`);
  });

  // 7. End stream after 1 hour
  setTimeout(
    async () => {
      await stopStream(stream.id);
      chat.disconnect();
      console.log('Stream ended');
    },
    60 * 60 * 1000
  );
}
```

### Example 2: Multi-Community Setup

```typescript
// Gigaverse has multiple communities, each with own platform connections

async function handleMultipleCommunities() {
  // Community A: Connected to YouTube and Facebook
  const communityA = await createCommunity('Community A');
  await connectPlatform(communityA.id, 'youtube');
  await connectPlatform(communityA.id, 'facebook');

  // Community B: Only connected to YouTube
  const communityB = await createCommunity('Community B');
  await connectPlatform(communityB.id, 'youtube');

  // Community A creates a stream
  const streamA = await createStream({
    communityId: communityA.id,
    title: 'Community A Stream',
    platforms: ['youtube', 'facebook'],
  });

  // Community B creates a stream
  const streamB = await createStream({
    communityId: communityB.id,
    title: 'Community B Stream',
    platforms: ['youtube'],
  });

  // Both streams use DIFFERENT YouTube accounts (based on OAuth)
  console.log(
    'Stream A YouTube:',
    streamA.platformStreams.find((p) => p.platform === 'youtube').streamUrl
  );
  console.log(
    'Stream B YouTube:',
    streamB.platformStreams.find((p) => p.platform === 'youtube').streamUrl
  );
  // These will be different YouTube channels!
}
```

---

## Security & Best Practices

### 1. API Key Storage

**❌ Never do this**:

```typescript
// DON'T expose API key in frontend code
const apiKey = 'omni_abc123...';
fetch('https://omnistream.com/api/v1/streams', {
  headers: { 'X-API-Key': apiKey },
});
```

**✅ Do this instead**:

```typescript
// Frontend calls your backend
const response = await fetch('/api/streams/create', {
  method: 'POST',
  body: JSON.stringify({ ... }),
});

// Your backend uses the API key
app.post('/api/streams/create', async (req, res) => {
  const community = await db.getCommunity(req.user.communityId);

  // Use API key from your database
  const omnistreamResponse = await fetch('https://omnistream.com/api/v1/streams', {
    headers: { 'X-API-Key': community.omnistream_api_key },
  });
});
```

### 2. HTTPS/TLS

**Production Requirements**:

- Deploy Omnistream behind HTTPS (use Let's Encrypt, Cloudflare, or AWS Certificate Manager)
- OAuth redirect URIs MUST use `https://` in production
- WebSocket connections should use `wss://` (not `ws://`)

### 3. Rate Limiting

Omnistream has built-in rate limiting (100 requests per 15 minutes by default). To avoid hitting limits:

```typescript
// Implement caching for stream status
const CACHE_TTL = 30000; // 30 seconds

let cachedStatus: any = null;
let cacheTime = 0;

async function getStreamStatusCached(streamId: string) {
  const now = Date.now();

  if (cachedStatus && now - cacheTime < CACHE_TTL) {
    return cachedStatus;
  }

  cachedStatus = await getStreamStatus(streamId);
  cacheTime = now;

  return cachedStatus;
}
```

### 4. Error Handling

Always handle platform-specific errors gracefully:

```typescript
async function createStreamWithFallback(data: CreateStreamRequest) {
  try {
    return await createStream(data);
  } catch (error: any) {
    // Check if error is from a specific platform
    if (error.message.includes('YouTube')) {
      // Retry without YouTube
      return await createStream({
        ...data,
        platforms: data.platforms.filter((p) => p !== 'youtube'),
      });
    }

    throw error;
  }
}
```

### 5. Token Security

**Omnistream handles this**, but be aware:

- OAuth tokens are stored encrypted in Omnistream's database
- Never log tokens in your application
- Rotate API keys if compromised:

```typescript
// If API key is compromised, create new community
const newCommunity = await createOmnistreamCommunity(community.name);
await migrateStreams(oldCommunity.id, newCommunity.id);
await deleteCommunity(oldCommunity.id);
```

---

## Production Deployment

### 1. Omnistream Server Deployment

#### Option A: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t omnistream .
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name omnistream \
  omnistream
```

#### Option B: PM2

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start dist/index.js --name omnistream

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

#### Option C: Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: omnistream
spec:
  replicas: 3
  selector:
    matchLabels:
      app: omnistream
  template:
    metadata:
      labels:
        app: omnistream
    spec:
      containers:
        - name: omnistream
          image: yourdockerhub/omnistream:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: omnistream-secrets
                  key: database-url
            - name: YOUTUBE_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: omnistream-secrets
                  key: youtube-client-secret
```

### 2. Database Migration

Replace in-memory database with PostgreSQL:

```sql
-- migrations/001_initial.sql

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE community_oauth_tokens (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP NOT NULL,
  scope TEXT[],
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (community_id, platform)
);

CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  rtmp_url VARCHAR(500) NOT NULL,
  rtmp_key VARCHAR(255) NOT NULL,
  platforms VARCHAR(50)[] NOT NULL,
  scheduled_start_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE platform_streams (
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_stream_id VARCHAR(255) NOT NULL,
  stream_url TEXT,
  status VARCHAR(50) NOT NULL,
  viewer_count INTEGER,
  error TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (stream_id, platform)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_image_url TEXT,
  message TEXT NOT NULL,
  highlighted BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_stream ON chat_messages(stream_id, timestamp);
CREATE INDEX idx_platform_streams_stream ON platform_streams(stream_id);
CREATE INDEX idx_streams_community ON streams(community_id);
```

### 3. Monitoring & Logging

```typescript
// Add to your Omnistream deployment

// 1. Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 2. Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// 3. Metrics endpoint (Prometheus format)
app.get('/metrics', (req, res) => {
  res.send(`
# HELP streams_active Number of active streams
# TYPE streams_active gauge
streams_active ${activeStreams.length}

# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total ${totalRequests}
  `);
});
```

### 4. Scaling Considerations

**Horizontal Scaling**:

- Deploy multiple Omnistream instances behind a load balancer
- Use Redis for session storage (WebSocket subscriptions)
- Use message queue (Redis Pub/Sub or RabbitMQ) for chat broadcasting

**Vertical Scaling**:

- Current implementation can handle ~100 concurrent streams per instance
- Each WebSocket connection uses ~1MB memory
- Database queries are optimized with indexes

### 5. Production Checklist

- [ ] Replace in-memory database with PostgreSQL
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure OAuth redirect URIs for production domain
- [ ] Set strong `API_KEY_SALT` and `JWT_SECRET` values
- [ ] Enable rate limiting and adjust limits for production
- [ ] Set up monitoring (Datadog, New Relic, or Prometheus)
- [ ] Configure log aggregation (Logtail, Papertrail, or ELK stack)
- [ ] Set up automated backups for database
- [ ] Configure CORS for your Gigaverse domain
- [ ] Test OAuth flow on production domain
- [ ] Load test WebSocket server (use `k6` or `artillery`)
- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI, or CircleCI)
- [ ] Configure auto-scaling rules (if using Kubernetes/AWS ECS)
- [ ] Set up SSL pinning for mobile apps (if applicable)
- [ ] Document runbook for common issues

---

## Troubleshooting

### OAuth Issues

**Problem**: "OAuth redirect URI mismatch"

**Solution**: Ensure the redirect URI in platform settings exactly matches the one in `.env`:

```bash
# In .env
YOUTUBE_REDIRECT_URI=https://omnistream.gigaverse.com/api/v1/auth/youtube/callback

# In Google Cloud Console → Credentials → OAuth 2.0 Client
# Authorized redirect URIs:
# https://omnistream.gigaverse.com/api/v1/auth/youtube/callback
```

---

**Problem**: "Token expired" errors

**Solution**: Omnistream auto-refreshes tokens. If this fails, user needs to re-authorize:

```typescript
// Check if token is valid
const status = await getStreamStatus(streamId);

if (status.error && status.error.includes('OAuth')) {
  // Prompt user to reconnect
  alert('Please reconnect your YouTube account');
  redirectToOAuthFlow('youtube');
}
```

---

**Problem**: "Facebook Page required"

**Solution**: Users need a Facebook Page to stream. Guide them:

```typescript
if (error.message.includes('No Facebook pages found')) {
  alert(`
    To stream to Facebook, you need a Facebook Page.

    1. Go to facebook.com/pages/create
    2. Create a Page for your community
    3. Come back and reconnect Facebook
  `);
}
```

---

### Stream Issues

**Problem**: "Stream not starting on platform"

**Solution**: Check RTMP source is active:

1. Verify user is streaming to the RTMP URL
2. Check stream health in your RTMP server logs
3. Test RTMP connection: `ffplay rtmp://your-server.com/live/stream-key`

---

**Problem**: "Platform stream created but shows offline"

**Solution**: Some platforms require a "warm-up" period:

- **YouTube**: 30-60 seconds to detect RTMP signal
- **Facebook**: Immediate (if RTMP is active)
- **TikTok**: 10-30 seconds

---

### Chat Issues

**Problem**: "Chat messages not appearing"

**Solution**: Check WebSocket connection:

```typescript
ws.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
  // Reconnect logic
});

ws.addEventListener('close', () => {
  console.log('WebSocket closed, reconnecting...');
  setTimeout(() => connectToChat(), 5000);
});
```

---

**Problem**: "Chat only showing from one platform"

**Solution**: Verify OAuth permissions include chat scopes:

- **YouTube**: `youtube.force-ssl` scope
- **Facebook**: `pages_read_engagement` permission
- **TikTok**: `live.room.info` scope

---

## Support

### For Gigaverse Teams

- **Frontend Team Lead**: [Contact info]
- **Backend Team Lead**: [Contact info]
- **DevOps**: [Contact info]

### For Omnistream Issues

- **GitHub Issues**: https://github.com/yourusername/omnistream/issues
- **Documentation**: See `README.md`, `PROJECT_STATUS.md`
- **API Reference**: See `FRONTEND_INTEGRATION.md`

---

## Appendix: API Reference

See complete API documentation in `README.md` and `FRONTEND_INTEGRATION.md`.

### Key Endpoints Summary

| Endpoint                           | Method    | Purpose           |
| ---------------------------------- | --------- | ----------------- |
| `/api/v1/communities`              | POST      | Create community  |
| `/api/v1/auth/:platform/authorize` | GET       | Get OAuth URL     |
| `/api/v1/auth/:platform/callback`  | GET       | OAuth callback    |
| `/api/v1/auth/:platform`           | DELETE    | Revoke OAuth      |
| `/api/v1/streams`                  | POST      | Create stream     |
| `/api/v1/streams/:id/start`        | POST      | Start stream      |
| `/api/v1/streams/:id/stop`         | POST      | Stop stream       |
| `/api/v1/streams/:id`              | GET       | Get stream status |
| `/ws/chat`                         | WebSocket | Real-time chat    |

---

**Last Updated**: 2025-10-03
**Version**: 1.0.0
**Maintained by**: Omnistream Team
