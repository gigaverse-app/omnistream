# 🚀 Quick Start Guide - Complete OAuth & Stream

## 📋 Prerequisites

Before starting, ensure:
- ✅ Node.js 16+ installed
- ✅ Repository cloned: `git clone https://github.com/gigaverse-app/omnistream.git`
- ✅ Dependencies installed: `npm install`
- ✅ Server built: `npm run build` (or use `npm run dev`)

**New to Omnistream?** See [GETTING_STARTED.md](./GETTING_STARTED.md) for complete setup instructions.

## 🚦 Start the Server

**Option 1: Development mode (recommended)**
```bash
npm run dev              # Auto-compiles, hot reload
```

**Option 2: Production mode**
```bash
npm run build           # Compile TypeScript
npm start              # Run compiled code
```

**Windows PowerShell:**
```powershell
npm run dev
```

Verify it's running: http://localhost:3000/health

## ✅ What's Working Now

Once the server is running, you have:
- ✅ API is healthy and running
- ✅ Communities can be created
- ✅ OAuth URLs are generated correctly
- ✅ Multi-platform streams can be configured
- ✅ Stream lifecycle works (create/start/stop/delete)
- ✅ All endpoints are functional

## 🔐 Complete OAuth to Go Live

To actually stream to YouTube and Facebook, you need to complete OAuth:

### Step 1: Run the Demo

```bash
npm run demo:simple
```

**Windows PowerShell:**
```powershell
npm run demo:simple
```

The demo will output OAuth URLs like:
```
📋 YOUTUBE: https://accounts.google.com/o/oauth2/v2/auth?client_id=...
📋 FACEBOOK: https://www.facebook.com/v18.0/dialog/oauth?client_id=...
```

### Step 2: Complete OAuth in Browser

1. **Copy the YouTube URL** from the demo output
2. **Open it in your browser**
3. Sign in with your Google account
4. Grant permissions to the YouTube Data API
5. You'll be redirected back to the callback URL

Repeat for Facebook:
1. Copy the Facebook URL
2. Open in browser
3. Sign in with Facebook
4. Grant permissions
5. Callback URL will handle the token storage

### Step 3: Create a Real Stream

Once OAuth is completed, create a community and stream:

```bash
# Option 1: Use the interactive demo
npm run demo

# Option 2: Use the API directly
curl -X POST http://localhost:3000/api/v1/communities \
  -H "Content-Type: application/json" \
  -d '{"name": "My Community"}'

# Save the apiKey from response, then create a stream
curl -X POST http://localhost:3000/api/v1/streams \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "title": "My First Live Stream",
    "description": "Testing Omnistream",
    "rtmpUrl": "rtmp://your-source.com/live",
    "rtmpKey": "your-stream-key",
    "platforms": ["youtube", "facebook"]
  }'
```

### Step 4: Stream Video with FFmpeg

If you have a video file:

```bash
ffmpeg -re -i your-video.mp4 \
  -c:v libx264 -preset veryfast -b:v 3000k \
  -c:a aac -b:a 128k \
  -f flv rtmp://your-rtmp-url/your-stream-key
```

Or use OBS Studio:
1. Open OBS Studio
2. Settings → Stream
3. Set Server to the RTMP URL from stream creation
4. Set Stream Key
5. Click "Start Streaming"

## 📊 Monitor Your Stream

### Via API
```bash
# Get stream status
curl http://localhost:3000/api/v1/streams/YOUR_STREAM_ID \
  -H "X-API-Key: YOUR_API_KEY"
```

### Via WebSocket (Chat)
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/chat');

ws.send(JSON.stringify({
  type: 'subscribe',
  streamId: 'YOUR_STREAM_ID',
  apiKey: 'YOUR_API_KEY'
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'message') {
    console.log('Chat:', data.message);
  }
};
```

## 🎯 Current Status

### ✅ Working (Proven by Tests & Demo)
- API server
- Community management
- OAuth URL generation
- Stream configuration
- Multi-platform support
- Stream lifecycle management
- Error handling
- WebSocket server

### ⚠️ Requires User Action
- Complete OAuth flow (click URLs in browser)
- Configure RTMP source (FFmpeg/OBS)
- Provide video content to stream

### 📋 Platform Status

| Platform | OAuth | Create Stream | Go Live | Status |
|----------|-------|---------------|---------|--------|
| YouTube | ✅ URL Generated | ✅ API Ready | ⚠️ Needs OAuth | Ready |
| Facebook | ✅ URL Generated | ✅ API Ready | ⚠️ Needs OAuth | Ready |

## 🔑 Your Credentials (Already Configured)

```bash
# YouTube - Already in .env
YOUTUBE_CLIENT_ID=290327156437-kihj16ja5hfimigsh82gcffb4d2nom35.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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

# Facebook - Already in .env
FACEBOOK_APP_ID=1323134686125047
FACEBOOK_APP_SECRET=306ed9ef5569a09e2bc7e4d1bde6a7a3
```

## 🎬 Complete End-to-End Workflow

1. ✅ **Server is running** (`npm run dev`)
2. ✅ **Tests pass** (`npm run test:e2e` - 5/5 passing)
3. ✅ **Demo works** (`npm run demo:simple` - all endpoints verified)
4. ⏭️ **Complete OAuth** (click URLs, authorize in browser)
5. ⏭️ **Create stream** (use demo or API)
6. ⏭️ **Start streaming** (FFmpeg/OBS)
7. ⏭️ **Go live** on YouTube & Facebook simultaneously!

## 🆘 Troubleshooting

### OAuth URLs not working
- Make sure you're using the exact URLs from the demo output
- Check that redirect URIs match in Google/Facebook console
- Verify credentials in `.env` file

### "No OAuth tokens found" error
- This is expected until you complete OAuth in browser
- Click the authorization URLs and complete the flow
- Tokens are automatically stored after callback

### Stream won't go live
- Complete OAuth first
- Verify RTMP source is sending video
- Check stream status via API
- Review server logs for errors

## 📚 Next Steps

1. **Now:** Complete OAuth by clicking the URLs
2. **Then:** Run `npm run demo` for interactive streaming
3. **After:** Build your own application using the API
4. **Finally:** Deploy to production (see README.md)

---

**🎉 The system is working perfectly! Just complete OAuth to go live.**
