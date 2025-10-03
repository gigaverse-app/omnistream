# Frontend Integration Guide for Omnistream

This guide explains how to integrate Omnistream's OAuth and streaming functionality into your frontend application (e.g., gigaverse.com).

## Table of Contents
- [Overview](#overview)
- [OAuth Integration](#oauth-integration)
- [Stream Management](#stream-management)
- [Real-time Chat](#real-time-chat)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)

## Overview

Omnistream handles ALL OAuth complexity server-side. Your frontend only needs to:
1. Redirect users to authorization URLs
2. Handle OAuth callback redirects
3. Make authenticated API calls using API keys

**No tokens, no refresh logic, no OAuth secrets in the frontend** - everything is managed by Omnistream.

## OAuth Integration

### Step 1: Create a Community

Each community in gigaverse gets its own Omnistream community and API key.

```typescript
// Create community when user signs up or creates their first stream
const response = await fetch('https://your-omnistream-api.com/api/v1/communities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: user.communityName, // e.g., "Jane's Community"
  }),
});

const { data } = await response.json();
const { id: communityId, apiKey } = data;

// Store apiKey securely in your database associated with this community
// DO NOT expose apiKey in frontend JavaScript - only use it for server-side API calls
```

### Step 2: Connect Social Media Platforms

When user clicks "Connect YouTube" or "Connect Facebook":

```typescript
async function connectPlatform(platform: 'youtube' | 'facebook' | 'tiktok') {
  // 1. Get authorization URL from Omnistream
  const response = await fetch(
    `https://your-omnistream-api.com/api/v1/auth/${platform}/authorize?communityId=${communityId}`
  );

  const { data } = await response.json();
  const { authUrl } = data;

  // 2. Redirect user to OAuth provider (YouTube, Facebook, etc.)
  window.location.href = authUrl;
}
```

### Step 3: Handle OAuth Callback

The OAuth callback is handled automatically by Omnistream. Configure redirect URLs:

**YouTube**: `https://your-omnistream-api.com/api/v1/auth/youtube/callback`
**Facebook**: `https://your-omnistream-api.com/api/v1/auth/facebook/callback`

After authorization, Omnistream shows a success page. You can customize this to redirect back to your app:

**Option A**: User manually closes the OAuth popup window
**Option B**: Auto-close with JavaScript:

```html
<!-- Customize auth success page in Omnistream -->
<script>
  window.opener?.postMessage({ type: 'oauth-success', platform: 'youtube' }, '*');
  window.close();
</script>
```

In your frontend:
```typescript
window.addEventListener('message', (event) => {
  if (event.data.type === 'oauth-success') {
    console.log(`${event.data.platform} connected!`);
    // Refresh UI to show connected state
    fetchConnectedPlatforms();
  }
});
```

### Step 4: Check Connected Platforms

You'll need to track which platforms are connected. Options:

**Option A**: Track in your own database when OAuth succeeds
**Option B**: Query Omnistream (requires adding an endpoint)

Recommended: Track in your DB with a `connected_platforms` field:

```typescript
// After successful OAuth
await yourDatabase.updateCommunity(communityId, {
  connectedPlatforms: ['youtube', 'facebook'], // Add platform to array
});
```

### Step 5: Disconnect a Platform

```typescript
async function disconnectPlatform(platform: string) {
  await fetch(
    `https://your-omnistream-api.com/api/v1/auth/${platform}?communityId=${communityId}`,
    {
      method: 'DELETE',
      headers: {
        'X-API-Key': apiKey, // From your database
      },
    }
  );

  // Update your database
  await yourDatabase.removePlatform(communityId, platform);
}
```

## Stream Management

### Creating a Multi-Platform Stream

```typescript
interface CreateStreamRequest {
  title: string;
  description?: string;
  rtmpUrl: string;              // Your RTMP server URL
  rtmpKey: string;              // Stream key from your RTMP server
  platforms: Array<'youtube' | 'facebook' | 'tiktok'>;
  scheduledStartTime?: string;  // ISO 8601 timestamp (optional)
}

async function createStream(streamData: CreateStreamRequest) {
  const response = await fetch('https://your-omnistream-api.com/api/v1/streams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey, // Community's API key from your database
    },
    body: JSON.stringify(streamData),
  });

  const { data } = await response.json();
  return data;
}

// Example usage
const stream = await createStream({
  title: "My First Multi-Platform Stream",
  description: "Streaming to YouTube and Facebook simultaneously!",
  rtmpUrl: "rtmp://gigaverse-rtmp.com/live",
  rtmpKey: "user-stream-key-12345",
  platforms: ['youtube', 'facebook'],
});

console.log(stream);
// {
//   stream: { id: 'uuid', title: '...', ... },
//   platformStreams: [
//     {
//       platform: 'youtube',
//       platformStreamId: 'youtube-broadcast-id',
//       streamUrl: 'https://www.youtube.com/watch?v=...',
//       status: 'ready'
//     },
//     {
//       platform: 'facebook',
//       platformStreamId: 'facebook-video-id',
//       streamUrl: 'https://www.facebook.com/...',
//       status: 'ready'
//     }
//   ]
// }
```

### Starting a Stream

```typescript
async function startStream(streamId: string) {
  const response = await fetch(
    `https://your-omnistream-api.com/api/v1/streams/${streamId}/start`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
    }
  );

  const { data } = await response.json();
  return data;
}
```

### Stopping a Stream

```typescript
async function stopStream(streamId: string) {
  const response = await fetch(
    `https://your-omnistream-api.com/api/v1/streams/${streamId}/stop`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
    }
  );

  const { data } = await response.json();
  return data;
}
```

### Getting Stream Status

```typescript
async function getStreamStatus(streamId: string) {
  const response = await fetch(
    `https://your-omnistream-api.com/api/v1/streams/${streamId}`,
    {
      headers: {
        'X-API-Key': apiKey,
      },
    }
  );

  const { data } = await response.json();
  return data;
}

// Poll for status updates
const statusInterval = setInterval(async () => {
  const status = await getStreamStatus(streamId);
  updateUI(status);

  if (status.stream.status === 'ended') {
    clearInterval(statusInterval);
  }
}, 5000); // Check every 5 seconds
```

### Listing All Streams

```typescript
async function listStreams() {
  const response = await fetch('https://your-omnistream-api.com/api/v1/streams', {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  const { data } = await response.json();
  return data; // Array of streams
}
```

## Real-time Chat Aggregation

Subscribe to live chat from all platforms via WebSocket:

```typescript
class OmnistreamChat {
  private ws: WebSocket | null = null;
  private onMessage: (message: ChatMessage) => void;

  constructor(onMessage: (message: ChatMessage) => void) {
    this.onMessage = onMessage;
  }

  connect(streamId: string, apiKey: string) {
    this.ws = new WebSocket('wss://your-omnistream-api.com/ws/chat');

    this.ws.onopen = () => {
      // Subscribe to stream chat
      this.ws?.send(JSON.stringify({
        type: 'subscribe',
        streamId,
        apiKey,
      }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        this.onMessage(data.message);
        // {
        //   id: 'msg-id',
        //   platform: 'youtube',
        //   authorName: 'User123',
        //   authorImageUrl: 'https://...',
        //   message: 'Hello!',
        //   timestamp: '2025-10-03T...',
        //   highlighted: false
        // }
      } else if (data.type === 'error') {
        console.error('Chat error:', data.message);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Chat connection closed');
    };
  }

  highlightMessage(messageId: string, platform: string) {
    this.ws?.send(JSON.stringify({
      type: 'highlight',
      messageId,
      platform,
    }));
  }

  disconnect() {
    this.ws?.send(JSON.stringify({ type: 'unsubscribe' }));
    this.ws?.close();
  }
}

// Usage
const chat = new OmnistreamChat((message) => {
  // Add message to your chat UI
  addMessageToUI(message);
});

chat.connect(streamId, apiKey);

// Later: disconnect
chat.disconnect();
```

## Error Handling

All API responses follow this structure:

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "PLATFORM_ERROR",
    "message": "YouTube API rate limit exceeded",
    "status": 429
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid API key |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_ERROR` | 429 | Too many requests |
| `PLATFORM_ERROR` | 500 | External platform API error |
| `UNSUPPORTED_FEATURE_ERROR` | 501 | Platform doesn't support feature |

### Example Error Handling

```typescript
async function createStreamWithErrorHandling(streamData: CreateStreamRequest) {
  try {
    const response = await fetch('https://your-omnistream-api.com/api/v1/streams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(streamData),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('OAuth')) {
        alert('Please reconnect your social media accounts');
        // Redirect to platform connection page
      } else if (error.message.includes('rate limit')) {
        alert('Too many requests. Please wait a moment.');
      } else {
        alert(`Error: ${error.message}`);
      }
    }
    throw error;
  }
}
```

## TypeScript Types

```typescript
interface Community {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

interface Stream {
  id: string;
  communityId: string;
  title: string;
  description?: string;
  rtmpUrl: string;
  rtmpKey: string;
  platforms: Platform[];
  scheduledStartTime?: string;
  createdAt: string;
  updatedAt: string;
}

interface PlatformStream {
  platform: Platform;
  platformStreamId: string;
  streamUrl?: string;
  status: 'ready' | 'live' | 'ended' | 'error';
  viewerCount?: number;
  error?: string;
}

interface ChatMessage {
  id: string;
  platform: Platform;
  authorId: string;
  authorName: string;
  authorImageUrl?: string;
  message: string;
  timestamp: string;
  highlighted: boolean;
}

type Platform = 'youtube' | 'facebook' | 'tiktok' | 'instagram';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}
```

## Complete React Example

```tsx
import { useState, useEffect } from 'react';

function StreamCreator() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [streamData, setStreamData] = useState({
    title: '',
    description: '',
    platforms: [] as Platform[],
  });

  // Connect a platform
  const handleConnectPlatform = async (platform: Platform) => {
    const response = await fetch(
      `https://api.omnistream.com/api/v1/auth/${platform}/authorize?communityId=${communityId}`
    );
    const { data } = await response.json();

    // Open OAuth in popup
    const popup = window.open(data.authUrl, 'oauth', 'width=600,height=700');

    // Listen for success
    window.addEventListener('message', (e) => {
      if (e.data.type === 'oauth-success' && e.data.platform === platform) {
        setConnectedPlatforms([...connectedPlatforms, platform]);
        popup?.close();
      }
    });
  };

  // Create and start stream
  const handleGoLive = async () => {
    // Create stream
    const createResponse = await fetch('https://api.omnistream.com/api/v1/streams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        ...streamData,
        rtmpUrl: userRtmpUrl,
        rtmpKey: userStreamKey,
      }),
    });

    const { data } = await createResponse.json();
    const streamId = data.stream.id;

    // Start stream
    await fetch(`https://api.omnistream.com/api/v1/streams/${streamId}/start`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
    });

    // Navigate to live stream page
    navigate(`/stream/${streamId}`);
  };

  return (
    <div>
      <h2>Connect Platforms</h2>
      {['youtube', 'facebook', 'tiktok'].map(platform => (
        <button
          key={platform}
          onClick={() => handleConnectPlatform(platform as Platform)}
          disabled={connectedPlatforms.includes(platform as Platform)}
        >
          {connectedPlatforms.includes(platform as Platform) ? '✓' : 'Connect'} {platform}
        </button>
      ))}

      <h2>Stream Settings</h2>
      <input
        value={streamData.title}
        onChange={(e) => setStreamData({ ...streamData, title: e.target.value })}
        placeholder="Stream title"
      />

      <h2>Select Platforms</h2>
      {connectedPlatforms.map(platform => (
        <label key={platform}>
          <input
            type="checkbox"
            checked={streamData.platforms.includes(platform)}
            onChange={(e) => {
              if (e.target.checked) {
                setStreamData({
                  ...streamData,
                  platforms: [...streamData.platforms, platform],
                });
              } else {
                setStreamData({
                  ...streamData,
                  platforms: streamData.platforms.filter(p => p !== platform),
                });
              }
            }}
          />
          {platform}
        </label>
      ))}

      <button onClick={handleGoLive} disabled={!streamData.title || streamData.platforms.length === 0}>
        Go Live!
      </button>
    </div>
  );
}
```

## Summary

### Frontend Responsibilities
✅ Redirect to OAuth URLs
✅ Handle OAuth success/failure
✅ Make authenticated API calls with API key
✅ Display stream status and chat
✅ Handle errors gracefully

### Omnistream Handles
✅ All OAuth token management
✅ Token refresh logic
✅ Multi-platform stream creation
✅ Chat aggregation from all platforms
✅ Stream lifecycle management
✅ Error handling and retries

---

**Questions or issues?** Open an issue at https://github.com/gigaverse-app/omnistream/issues
