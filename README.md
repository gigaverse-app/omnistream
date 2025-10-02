# OmniStream

A TypeScript/Node.js middleware exposing RESTful APIs to stream RTMP to YouTube, Facebook (Gaming), TikTok, and Instagram simultaneously. Features include per-community OAuth token management, pre-scheduled and ad-hoc stream creation with RTMP credentials, real-time chat retrieval across platforms, posting messages, and pinning/highlighting notifications.

## Features

- **Multi-Platform Streaming**: Stream simultaneously to YouTube, Facebook, TikTok, and Instagram
- **OAuth Token Management**: Per-community token storage and automatic refresh
- **Stream Management**: Create pre-scheduled or ad-hoc streams with RTMP credentials
- **Real-Time Chat**: Retrieve chat messages from all platforms
- **Message Management**: Post messages, pin, and highlight across platforms
- **Modular Architecture**: Independent platform providers behind abstract interfaces
- **Graceful Degradation**: Continues operation even if one platform fails
- **Fully Tested**: Comprehensive unit and integration tests with Jest and Playwright

## Architecture

The project follows a modular, layered architecture:

```
src/
├── types/           # TypeScript type definitions
├── interfaces/      # Abstract interfaces for services and providers
├── config/          # Configuration management
├── providers/       # Platform-specific implementations
│   ├── BasePlatformProvider.ts
│   ├── YouTubeProvider.ts
│   ├── FacebookProvider.ts
│   ├── TikTokProvider.ts
│   └── InstagramProvider.ts
├── services/        # Business logic layer
│   ├── TokenManager.ts
│   ├── StreamService.ts
│   └── ChatService.ts
├── routes/          # RESTful API endpoints
│   ├── oauth.ts
│   ├── streams.ts
│   └── chat.ts
├── utils/           # Utility functions
└── app.ts           # Express application setup
```

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure your OAuth credentials:

```bash
cp .env.example .env
```

Edit `.env` with your platform credentials:

```env
PORT=3000
NODE_ENV=development

# YouTube OAuth
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# TikTok OAuth
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# RTMP Server
RTMP_SERVER_URL=rtmp://localhost/live
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run in production
npm start

# Run tests
npm test

# Run end-to-end tests
npm run test:e2e

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## API Documentation

### Health Check

```http
GET /health
```

Returns the health status of the API.

### OAuth

#### Get OAuth URL

```http
GET /oauth/:platform/auth?communityId=<community_id>
```

Returns the OAuth authorization URL for the specified platform.

**Platforms**: `youtube`, `facebook`, `tiktok`, `instagram`

**Response**:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://..."
  }
}
```

#### OAuth Callback

```http
GET /oauth/:platform/callback?code=<code>&state=<community_id>
```

Handles the OAuth callback and stores the token.

#### Delete Token

```http
DELETE /oauth/:platform/token?communityId=<community_id>
```

Removes the stored OAuth token for a platform.

### Streams

#### Create Stream

```http
POST /streams
Content-Type: application/json

{
  "communityId": "community-123",
  "title": "My Live Stream",
  "description": "Stream description",
  "platforms": ["youtube", "facebook"],
  "scheduledStartTime": "2024-01-01T12:00:00Z"
}
```

Creates a new stream across specified platforms.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "stream_...",
    "communityId": "community-123",
    "title": "My Live Stream",
    "platforms": ["youtube", "facebook"],
    "rtmpCredentials": {
      "url": "rtmp://...",
      "key": "..."
    },
    "status": "scheduled",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

#### Get Stream

```http
GET /streams/:streamId
```

Retrieves stream information by ID.

#### Get Community Streams

```http
GET /streams/community/:communityId
```

Retrieves all streams for a community.

#### Start Stream

```http
POST /streams/:streamId/start
```

Starts the stream on all platforms.

#### End Stream

```http
POST /streams/:streamId/end
```

Ends the stream on all platforms.

#### Get Stream Status

```http
GET /streams/:streamId/status
```

Retrieves the current status of the stream across all platforms.

### Chat

#### Get Messages

```http
GET /chat/:streamId/messages?platform=<platform>&limit=<limit>
```

Retrieves chat messages from the stream.

**Query Parameters**:
- `platform` (optional): Filter by platform
- `limit` (optional, default: 50): Number of messages to retrieve

#### Post Message

```http
POST /chat/:streamId/messages
Content-Type: application/json

{
  "platforms": ["youtube", "facebook"],
  "message": "Hello from OmniStream!"
}
```

Posts a message to the specified platforms.

#### Pin Message

```http
POST /chat/:streamId/messages/:messageId/pin
Content-Type: application/json

{
  "platform": "youtube"
}
```

Pins a message on the specified platform.

#### Highlight Message

```http
POST /chat/:streamId/messages/:messageId/highlight
Content-Type: application/json

{
  "platform": "youtube"
}
```

Highlights a message on the specified platform.

## Testing

The project includes comprehensive testing:

### Unit Tests

Unit tests are written using Jest and cover:
- Platform providers
- Token manager
- Stream service
- Chat service

Run unit tests:
```bash
npm test
```

### Integration Tests

End-to-end tests are written using Playwright and test the full API:

```bash
npm run test:e2e
```

## Platform Providers

Each platform provider implements the `IPlatformProvider` interface and handles:

1. **OAuth**: Authorization URL generation, token exchange, and refresh
2. **Stream Management**: Creating, starting, and ending streams
3. **Chat**: Retrieving and posting messages, pinning, and highlighting

### Graceful Degradation

The system is designed for graceful degradation. If one platform fails:
- Other platforms continue to function normally
- Errors are logged but don't stop the overall operation
- The API returns partial success with available data

## Production Considerations

⚠️ **Note**: The current implementation uses mock API calls for platform providers. In a production environment, you would need to:

1. Implement actual API calls to each platform using their official SDKs/APIs:
   - YouTube Live Streaming API
   - Facebook Live API
   - TikTok Live API
   - Instagram Live API

2. Implement persistent storage for:
   - OAuth tokens (currently in-memory)
   - Stream configurations (currently in-memory)
   - Chat history (currently in-memory)

3. Add proper error handling and retry logic

4. Implement rate limiting and request throttling

5. Add authentication/authorization for the API endpoints

6. Set up monitoring and logging infrastructure

7. Configure HTTPS and security headers

8. Deploy with proper scaling and load balancing

## License

ISC

## Contributing

Contributions are welcome! Please follow the existing code style and add tests for any new features.
