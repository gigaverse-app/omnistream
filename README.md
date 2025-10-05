# Omnistream - Multi-Platform Live Streaming Middleware

TypeScript/Node.js middleware that provides RESTful APIs to stream RTMP to YouTube, Facebook, TikTok, and Instagram simultaneously. Handles OAuth, stream scheduling, real-time chat aggregation, and message highlighting.

## 🚀 Features

- **Multi-Platform Streaming**: Stream to YouTube, Facebook, TikTok, and Instagram from a single RTMP source
- **OAuth Management**: Per-community OAuth token storage and refresh for each platform
- **Stream Control**: Create, start, stop, and monitor streams across all platforms
- **Real-Time Chat**: WebSocket server aggregates chat messages from all platforms
- **Graceful Degradation**: Continues working even if individual platforms fail
- **Type-Safe**: Full TypeScript implementation with strict mode

## 📋 Platform Support

| Platform  | OAuth | Streams | Chat | Highlights | Status |
|-----------|-------|---------|------|------------|--------|
| YouTube   | ✅    | ✅      | ✅   | ❌         | Fully Supported |
| Facebook  | ✅    | ✅      | ✅   | ❌         | Fully Supported |
| TikTok    | ⚠️    | ⚠️      | ⚠️   | ⚠️         | Requires API Approval |
| Instagram | ❌    | ❌      | ❌   | ❌         | No Official API |

**Note**: Message highlighting is not supported by any platform's public API.

## 🏗️ Architecture

```
omnistream/
├── src/
│   ├── core/              # Interfaces, types, errors, services
│   ├── providers/         # Platform implementations
│   │   ├── youtube/       # YouTube Live Streaming API
│   │   ├── facebook/      # Facebook Graph API
│   │   ├── tiktok/        # TikTok LIVE Access API (stub)
│   │   └── instagram/     # Instagram (stub - no official API)
│   ├── api/              # REST API routes and middleware
│   ├── database/         # In-memory data store
│   ├── websocket/        # Real-time chat server
│   └── utils/            # Config, logging
```

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/omnistream.git
cd omnistream

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# See Environment Variables section below
```

## 🚦 Quick Start

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run integration tests
npm run test:integration

# Run demos
npm run demo:simple     # Automated API demo
npm run demo            # Interactive streaming demo
```

The server will start on `http://localhost:3000` by default.

### 🌐 Web Dashboard

Access the browser-based admin dashboard at:
```
http://localhost:3000/dashboard
```

The dashboard provides a complete UI for:
- Creating communities and managing API keys
- OAuth authorization for YouTube and Facebook
- Creating and managing multi-platform streams
- Starting/stopping streams with visual controls
- Viewing RTMP credentials
- Real-time chat monitoring via WebSocket

See `public/README.md` for detailed dashboard documentation.

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Most endpoints require an API key header:
```
X-API-Key: omni_xxxxxxxxxxxxx
```

### Endpoints

#### Communities

**Create a Community**
```http
POST /api/v1/communities
Content-Type: application/json

{
  "name": "My Community"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Community",
    "apiKey": "omni_xxxxxxxxxxxxx",
    "createdAt": "2025-10-02T...",
    "updatedAt": "2025-10-02T..."
  }
}
```

**List Communities**
```http
GET /api/v1/communities
```

#### OAuth Authorization

**Get Authorization URL**
```http
GET /api/v1/auth/:platform/authorize?communityId=<community-id>
```

Platforms: `youtube`, `facebook`, `tiktok`

Response:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/...",
    "platform": "youtube",
    "communityId": "uuid"
  }
}
```

**OAuth Callback** (handled by browser)
```http
GET /api/v1/auth/:platform/callback?code=...&state=<community-id>
```

**Revoke Authorization**
```http
DELETE /api/v1/auth/:platform?communityId=<community-id>
```

#### Streams

**Create a Stream**
```http
POST /api/v1/streams
X-API-Key: omni_xxxxxxxxxxxxx
Content-Type: application/json

{
  "title": "My Live Stream",
  "description": "Stream description",
  "rtmpUrl": "rtmp://your-rtmp-server.com/live",
  "rtmpKey": "your-stream-key",
  "platforms": ["youtube", "facebook"],
  "scheduledStartTime": "2025-10-03T10:00:00Z" // optional
}
```

Response:
```json
{
  "success": true,
  "data": {
    "stream": {
      "id": "stream-uuid",
      "title": "My Live Stream",
      "platforms": ["youtube", "facebook"],
      ...
    },
    "platformStreams": [
      {
        "platform": "youtube",
        "platformStreamId": "youtube-broadcast-id",
        "streamUrl": "https://www.youtube.com/watch?v=...",
        "status": "scheduled"
      },
      {
        "platform": "facebook",
        "platformStreamId": "facebook-video-id",
        "streamUrl": "https://www.facebook.com/...",
        "status": "scheduled"
      }
    ]
  }
}
```

**List Streams**
```http
GET /api/v1/streams
X-API-Key: omni_xxxxxxxxxxxxx
```

**Get Stream Status**
```http
GET /api/v1/streams/:streamId
X-API-Key: omni_xxxxxxxxxxxxx
```

**Start Stream**
```http
POST /api/v1/streams/:streamId/start
X-API-Key: omni_xxxxxxxxxxxxx
```

**Stop Stream**
```http
POST /api/v1/streams/:streamId/stop
X-API-Key: omni_xxxxxxxxxxxxx
```

**Delete Stream**
```http
DELETE /api/v1/streams/:streamId
X-API-Key: omni_xxxxxxxxxxxxx
```

### WebSocket Chat

Connect to real-time chat aggregation:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/chat');

// Subscribe to stream chat
ws.send(JSON.stringify({
  type: 'subscribe',
  streamId: 'your-stream-id',
  apiKey: 'omni_xxxxxxxxxxxxx'
}));

// Receive messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'message') {
    console.log('New chat message:', data.message);
    // {
    //   id: 'msg-id',
    //   platform: 'youtube',
    //   authorName: 'User123',
    //   message: 'Hello!',
    //   timestamp: '2025-10-02T...'
    // }
  }
};

// Highlight a message
ws.send(JSON.stringify({
  type: 'highlight',
  messageId: 'msg-id',
  platform: 'youtube'
}));

// Unsubscribe
ws.send(JSON.stringify({
  type: 'unsubscribe'
}));
```

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (future: PostgreSQL)
DATABASE_URL=memory://

# YouTube OAuth
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/v1/auth/youtube/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/v1/auth/facebook/callback

# TikTok OAuth (requires LIVE Access API approval)
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/auth/tiktok/callback

# Security
API_KEY_SALT=random_salt_string
JWT_SECRET=random_jwt_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Getting OAuth Credentials

**YouTube:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI

**Facebook:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app
3. Add Facebook Login product
4. Configure OAuth redirect URIs

**TikTok:**
1. Apply for [TikTok LIVE Access API](https://developers.tiktok.com/)
2. Note: Requires special approval and is not generally available

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

Current test coverage: 28 passing tests across providers and database layer.

## 🏭 Production Deployment

### Build and Run

```bash
npm run build
npm start
```

### Docker (Coming Soon)

```bash
docker build -t omnistream .
docker run -p 3000:3000 --env-file .env omnistream
```

### Production Checklist

- [ ] Replace in-memory database with PostgreSQL
- [ ] Set up proper logging (e.g., Winston, Datadog)
- [ ] Configure reverse proxy (nginx)
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring and alerts
- [ ] Configure auto-scaling
- [ ] Implement database backups
- [ ] Add API rate limiting per API key
- [ ] Set up CI/CD pipeline

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

ISC License

## 🔗 Related Projects

- [StreamYard](https://streamyard.com/) - Inspiration for multi-platform streaming
- [Restream](https://restream.io/) - Commercial multi-platform streaming service
- [OBS Studio](https://obsproject.com/) - Open source streaming software

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/omnistream/issues)
- Documentation: See `PROJECT_STATUS.md` for detailed project status

## 🗺️ Roadmap

- [x] Core platform providers (YouTube, Facebook)
- [x] REST API
- [x] WebSocket chat aggregation
- [x] Unit tests
- [ ] 80% test coverage
- [ ] PostgreSQL database support
- [ ] Stream analytics
- [ ] Webhooks for stream events
- [ ] Admin dashboard
- [ ] Docker deployment
- [ ] Kubernetes support
- [ ] CDN integration for better latency

---

Built with ❤️ for the live streaming community
