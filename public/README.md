# Omnistream Web Dashboard

A browser-based admin dashboard for managing multi-platform live streams.

## 🌐 Access

Once the Omnistream server is running, access the dashboard at:

```
http://localhost:3000/dashboard
```

Or in GitHub Codespaces, click the "Ports" tab and open the forwarded port 3000 in your browser, then navigate to `/dashboard`.

## ✨ Features

### 1. Community Management
- Create a new community with a single click
- Receive and store API credentials
- Copy API key and community ID to clipboard
- Reset dashboard to start fresh

### 2. OAuth Authorization
- Authorize YouTube and Facebook accounts
- Visual indicators showing authorization status (✅/❌)
- One-click authorization via OAuth popup
- Persistent authorization tracking

### 3. Stream Management
- **Create Streams**:
  - Title and description
  - Multi-platform selection (YouTube, Facebook, or both)
  - RTMP configuration (URL and stream key)
  - Optional scheduled start time

- **View Streams**:
  - All streams in a card-based layout
  - Platform badges showing where stream will broadcast
  - Current status (idle/live/error)
  - RTMP credentials with copy buttons

- **Control Streams**:
  - Start streaming to all platforms
  - Stop streaming
  - Delete streams
  - Refresh status in real-time
  - Automatic status polling every 10 seconds

### 4. Live Chat
- Select active stream to monitor
- Real-time chat messages via WebSocket
- Platform badges (YouTube/Facebook)
- Author names and timestamps
- Auto-scroll to latest messages
- Connection status indicator
- Automatic reconnection on disconnect

## 🎯 Quick Start

### First Time Setup

1. **Start the Omnistream server**:
   ```bash
   npm run dev
   ```

2. **Open the dashboard**:
   ```
   http://localhost:3000/dashboard
   ```

3. **Create a community**:
   - Enter a community name
   - Click "Create Community"
   - Your API key will be automatically saved

4. **Authorize platforms**:
   - Go to "OAuth Setup" tab
   - Click "Authorize YouTube"
   - Sign in and grant permissions
   - Repeat for Facebook

5. **Create your first stream**:
   - Go to "Streams" tab
   - Fill in stream details
   - Select platforms
   - Click "Create Stream"
   - Copy RTMP credentials

6. **Start streaming**:
   - Click "Start Stream"
   - Use FFmpeg or OBS with the RTMP credentials
   - Monitor status in real-time

7. **Monitor chat**:
   - Go to "Live Chat" tab
   - Select your stream
   - Watch messages from all platforms in real-time

## 📋 Usage Examples

### Creating a Stream

1. Navigate to the "Streams" tab
2. Fill in the form:
   - **Title**: "My Live Stream"
   - **Description**: "Testing multi-platform streaming"
   - **Platforms**: Check YouTube and Facebook
   - **RTMP URL**: `rtmp://localhost/live` (default)
   - **RTMP Key**: `my-stream-key-123`
3. Click "Create Stream"
4. The stream card appears with RTMP credentials

### Starting a Stream

1. In the stream card, click "Start Stream"
2. The status will update to show the stream is starting
3. Use the RTMP credentials in your streaming software:
   - **OBS**: Settings → Stream → Custom Server
   - **FFmpeg**: `ffmpeg -re -i video.mp4 -c copy -f flv rtmp://url/key`

### Monitoring Chat

1. Go to "Live Chat" tab
2. Select your stream from the dropdown
3. WebSocket connects automatically
4. Chat messages appear in real-time
5. Messages are color-coded by platform

## 🏗️ Architecture

### Frontend Components

```
public/
├── dashboard.html          # Main HTML structure
├── css/
│   └── dashboard.css       # Modern, responsive styling
└── js/
    ├── api-client.js       # API wrapper (REST)
    ├── websocket-client.js # WebSocket handler (Chat)
    └── dashboard.js        # Main application logic
```

### Data Flow

1. **API Communication**:
   ```
   Dashboard → API Client → REST API → Backend Services
   ```

2. **Real-Time Chat**:
   ```
   Dashboard → WebSocket Client → WebSocket Server → Platform APIs
   ```

3. **Local Storage**:
   - API Key (persistent)
   - Community ID (persistent)
   - OAuth status (tracked client-side)

## 🔧 Technical Details

### API Client (`api-client.js`)
- Wraps all REST API endpoints
- Automatic API key management
- localStorage integration
- Error handling and retry logic

### WebSocket Client (`websocket-client.js`)
- Manages WebSocket connection lifecycle
- Auto-reconnection (up to 5 attempts)
- Subscribe/unsubscribe from streams
- Message highlighting support

### Dashboard App (`dashboard.js`)
- Single-page application (SPA)
- Tab-based navigation
- Real-time status polling
- Toast notifications
- Responsive design

### Styling
- Modern CSS Grid and Flexbox
- Mobile-responsive
- Toast notifications
- Loading states
- Platform-specific badges

## 🔐 Security Notes

- API keys stored in localStorage (browser-only)
- OAuth handled via popup windows
- CORS enabled on backend
- Rate limiting applied to API

## 🌐 Browser Compatibility

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

Requirements:
- WebSocket support
- localStorage support
- Fetch API support
- ES6+ JavaScript

## 🐛 Troubleshooting

### Dashboard not loading
- Ensure server is running (`npm run dev`)
- Check console for JavaScript errors
- Verify `/dashboard` endpoint returns 200

### Can't create community
- Check API connection status (top-right badge)
- Open browser console for error messages
- Verify backend is running and healthy

### OAuth not working
- Make sure popup blockers are disabled
- Check OAuth credentials in `.env` file
- Verify redirect URIs match configuration

### WebSocket not connecting
- Check WebSocket status in Chat tab
- Verify WebSocket endpoint: `ws://localhost:3000/ws/chat`
- Check browser console for connection errors

### Streams not updating
- Click "Refresh Status" button manually
- Check if stream exists on the platform
- Verify OAuth tokens are valid

## 💡 Tips

1. **First time**: Complete OAuth before creating streams
2. **Testing**: Use `rtmp://localhost/live` for local testing
3. **Production**: Update RTMP URLs to actual streaming servers
4. **Multiple streams**: Create different stream keys for each
5. **Chat monitoring**: Keep Chat tab open during live streams

## 🚀 Advanced Usage

### Custom RTMP Sources

You can use any RTMP source:
- OBS Studio
- FFmpeg
- Hardware encoders
- Other streaming software

### Multi-Platform Broadcasting

Create a single stream, select multiple platforms, and broadcast to:
- YouTube Live
- Facebook Live
- Both simultaneously

### Real-Time Monitoring

- Stream status updates every 10 seconds
- Chat messages in real-time via WebSocket
- Platform-specific error messages
- Viewer counts (if supported by platform)

## 📖 API Reference

The dashboard uses these API endpoints:

- `POST /api/v1/communities` - Create community
- `GET /api/v1/auth/{platform}/authorize` - Get OAuth URL
- `POST /api/v1/streams` - Create stream
- `GET /api/v1/streams` - List streams
- `GET /api/v1/streams/:id` - Get stream status
- `POST /api/v1/streams/:id/start` - Start stream
- `POST /api/v1/streams/:id/stop` - Stop stream
- `DELETE /api/v1/streams/:id` - Delete stream

WebSocket endpoint:
- `ws://localhost:3000/ws/chat` - Real-time chat

## 🎨 Customization

The dashboard can be customized by editing:

- `css/dashboard.css` - Colors, fonts, layout
- `js/dashboard.js` - Application logic
- `dashboard.html` - Structure and content

CSS variables for easy theming:
```css
:root {
  --primary-color: #6366f1;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --bg-color: #f9fafb;
  --surface-color: #ffffff;
}
```

## 📝 License

Part of the Omnistream project - ISC License

---

**Built with ❤️ for easy multi-platform live streaming**
