# 🌐 Omnistream Web Dashboard

An interactive web-based demo application showcasing Omnistream's multi-platform live streaming capabilities. Perfect for demonstrating to colleagues why they should integrate Omnistream into Gigaverse and other metaverse applications.

## ✨ Features

### 🔐 Community Management

- Create communities with auto-generated API keys
- Login with existing API keys
- Secure API key generation
- Community profile management

### 🌐 OAuth Platform Integration

- **YouTube** - Connect and stream to YouTube Live
- **Facebook** - Stream to Facebook Live
- **TikTok** - Stream to TikTok Live (requires LIVE Access API approval)
- Visual connection status for each platform
- One-click OAuth flow

### 📺 Stream Management

- Create multi-platform streams
- Configure stream title and description
- Select target platforms for simultaneous streaming
- Real-time RTMP ingest URL and stream key display
- Live stream status indicators

### ⚡ Real-Time Controls

- Start/Stop streams with one click
- Auto-refresh stream status every 5 seconds
- Stream health monitoring
- Delete streams

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Omnistream API server must be running first

### Installation & Running

**Step 1: Start the Omnistream API Server**

In your main Omnistream directory:

```bash
# Navigate to root
cd /path/to/omnistream

# Install dependencies (first time only)
npm install

# Option 1: Development mode (recommended)
npm run dev              # Auto-compiles TypeScript

# Option 2: Production mode
npm run build            # Build TypeScript first
npm start               # Then start server
```


**Step 2: Start the Web Dashboard**

In a **new terminal**:

```bash
# Navigate to dashboard
cd examples/web-dashboard

# Install dependencies (first time only)
npm install

# Start dashboard server
npm start
```

**Step 3: Open in Browser**

```
http://localhost:4000
```

### Troubleshooting

**Error: "Failed to fetch" / CORS errors**

- Ensure Omnistream API is running on http://localhost:3000
- Check terminal 1 shows: `Server running on port 3000`

**Error: Dashboard won't start**

- Port 4000 might be in use, change `DASHBOARD_PORT` in `.env`
- Ensure dependencies installed: `npm install`

**Error: "Cannot find module dist/index.js" in main server**

- You forgot to build! Run: `npm run build` OR use `npm run dev`

## 📖 How to Use

### Step 1: Create a Community

1. Navigate to the dashboard in your browser
2. Enter a community name (e.g., "Gigaverse Gaming")
3. Click "Create Community"
4. Your API key will be automatically generated and saved

**Or** if you already have an API key:

1. Click on "Use Existing API Key"
2. Paste your API key
3. Click "Login"

### Step 2: Connect Platforms

1. After creating/logging into your community, scroll to "Connect Streaming Platforms"
2. Click "Connect YouTube" (or Facebook/TikTok)
3. Complete the OAuth flow in the popup window
4. The platform will show as "Connected" ✓

### Step 3: Create a Stream

1. In the "Stream Management" section, enter:
   - Stream Title (e.g., "Gigaverse Launch Event")
   - Stream Description (optional)
   - Select target platforms (check the boxes)
2. Click "Create Stream"
3. Your stream is created! Copy the RTMP ingest URL and stream key

### Step 4: Start Streaming

1. Click "▶ Start Stream" button
2. Stream status changes to "🔴 LIVE"
3. Use the RTMP ingest URL and stream key in your streaming software (OBS, etc.)
4. Your stream goes live on all selected platforms simultaneously!

### Step 5: Monitor & Control

- Watch the real-time status updates
- Click "⏹ Stop Stream" to end the broadcast
- Use "🔄 Refresh" to manually update stream info
- Click "🗑 Delete" to remove a stream

## 🎯 Demo Scenarios for Colleagues

### Scenario 1: Multi-Platform Reach

**Show:** Create a single stream targeting YouTube, Facebook, and TikTok simultaneously
**Highlight:** "One API call, three platforms. Imagine the reach for Gigaverse events!"

### Scenario 2: Easy OAuth

**Show:** Connect a YouTube account with 2 clicks
**Highlight:** "No complex OAuth implementation needed. Omnistream handles it all."

### Scenario 3: Stream Management

**Show:** Start/stop streams, view ingest URLs
**Highlight:** "Full programmatic control. Perfect for automated metaverse events."

### Scenario 4: Real-Time Status

**Show:** Live status updates and health monitoring
**Highlight:** "Know exactly when your stream is live across all platforms."

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the web-dashboard directory:

```env
# Dashboard port (default: 4000)
DASHBOARD_PORT=4000

# Omnistream API URL (default: http://localhost:3000)
OMNISTREAM_API_URL=http://localhost:3000
```

### Omnistream Server Configuration

Ensure your main Omnistream server (in the root directory) has:

1. **Database configured** (.env file with DATABASE_URL)
2. **OAuth credentials set up** for YouTube, Facebook, TikTok
3. **Proper redirect URIs** configured in platform developer consoles

See the main [Omnistream README](../../README.md) for server setup details.

## 🏗️ Architecture

### Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Express.js (proxy server)
- **Template Engine:** EJS
- **API Communication:** Axios
- **Styling:** Custom CSS with CSS Grid & Flexbox

### File Structure

```
web-dashboard/
├── server.js              # Express server & API proxy
├── package.json           # Dependencies
├── playwright.config.js   # Playwright test configuration
├── test-dashboard.sh      # Bash API test script
├── README.md             # This file
├── tests/
│   └── dashboard.test.js # Playwright E2E tests
├── views/
│   ├── index.ejs         # Main dashboard UI
│   └── oauth-callback.ejs # OAuth callback handler
└── public/
    ├── css/
    │   └── style.css     # Styling
    └── js/
        └── app.js        # Client-side logic
```

### API Proxy Pattern

The dashboard acts as a proxy to avoid CORS issues:

```
Browser → Dashboard Server → Omnistream API
```

All API calls are proxied through `/api/*` endpoints.

## 💡 Why Omnistream for Gigaverse?

### ✅ Benefits Demonstrated

1. **Unified API** - One integration for multiple platforms
2. **OAuth Abstraction** - No need to implement OAuth for each platform
3. **Multi-Platform Broadcasting** - Reach users across all major platforms
4. **Real-Time Control** - Programmatic start/stop for automated events
5. **Stream Health Monitoring** - Know when things go wrong
6. **Scalable Architecture** - RESTful API design for easy integration

### 🎮 Gigaverse Use Cases

- **Virtual Concerts** - Stream metaverse events to YouTube, Facebook, TikTok
- **Gaming Tournaments** - Broadcast competitions across platforms
- **Virtual Conferences** - Share presentations with wider audiences
- **Social Events** - Amplify in-world gatherings to social media
- **Product Launches** - Maximize reach for new features/worlds

## 🧪 Testing

The web dashboard includes comprehensive test coverage to ensure everything works end-to-end.

### Automated Tests

#### 1. Bash API Test Script

Tests all API endpoints and verifies the dashboard backend works correctly:

```bash
./test-dashboard.sh
```

**What it tests:**

- Server health checks
- Community creation
- API key authentication
- Platform list retrieval
- OAuth URL generation
- Stream CRUD operations
- Error handling

**Expected output:**

```
✓ All 12 tests passed!
```

#### 2. Playwright E2E Tests

Tests the complete user interface and user workflows:

```bash
npm test
```

**What it tests:**

- Homepage loads correctly
- Community creation flow
- Login with API key
- Platform connection UI
- Stream management UI
- Form validation
- Session persistence
- Logout functionality
- Error states

**Expected output:**

```
16 passed (18.8s)
```

### Running Tests

1. **Start both servers:**

   ```bash
   # Terminal 1: Start Omnistream API
   cd /workspaces/omnistream
   npm run dev

   # Terminal 2: Start Dashboard
   cd examples/web-dashboard
   npm start
   ```

2. **Run bash tests:**

   ```bash
   ./test-dashboard.sh
   ```

3. **Run Playwright tests:**

   ```bash
   npm test
   ```

4. **Run Playwright tests with UI (for debugging):**

   ```bash
   npm run test:ui
   ```

5. **Run Playwright tests in headed mode (see the browser):**
   ```bash
   npm run test:headed
   ```

### Test Results

After running tests, you can view:

- **Bash test output**: Displays in terminal with ✓/✗ indicators
- **Playwright HTML report**: Run `npm run test:report` to view detailed results
- **Screenshots**: Test failures include automatic screenshots in `test-results/`

### Continuous Testing

For development, you can run the Omnistream API test suite which also validates the dashboard:

```bash
cd /workspaces/omnistream
npm test
```

## 🔒 Security Notes

- API keys are stored in localStorage (demo purposes only)
- For production, implement proper session management
- Use HTTPS in production environments
- Rotate OAuth credentials regularly
- Implement rate limiting for API endpoints

## 🐛 Troubleshooting

### Dashboard won't start

- Ensure port 4000 is available (or change DASHBOARD_PORT)
- Check that dependencies are installed (`npm install`)

### Can't connect to Omnistream API

- Verify Omnistream server is running on port 3000
- Check OMNISTREAM_API_URL environment variable
- Ensure database is configured and migrations are run

### OAuth not working

- Verify OAuth credentials in Omnistream .env file
- Check redirect URIs match in platform developer consoles
- Ensure popup blockers are disabled

### Streams not appearing

- Check that you're logged in
- Verify API key is valid (check browser console)
- Ensure at least one platform is connected

## 📚 Additional Resources

- [Omnistream Main Documentation](../../README.md)
- [API Documentation](../../docs/API.md)
- [Gigaverse Integration Guide](../../docs/gigaverse-integration.md)

## 🤝 Support

For issues or questions:

- Check the [main Omnistream repository](../../)
- Review API logs for debugging
- Inspect browser console for frontend errors

---

**Built with ❤️ for Gigaverse and the metaverse community**
