# 🚀 Getting Started with Omnistream

Complete guide to set up and run Omnistream for the first time.

## 📋 Prerequisites

- **Node.js** 16+ (recommended: 18 or 20)
- **npm** 8+ (comes with Node.js)
- **Git** (for cloning the repository)
- **Port 3000** available (for API server)
- **Port 4000** available (for web dashboard, optional)

### Check Your Installation

```bash
node --version    # Should show v16+ or higher
npm --version     # Should show 8+ or higher
```

## 📥 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/gigaverse-app/omnistream.git
cd omnistream
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages for the API server.

### Step 3: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials (optional for basic testing)
```

**Minimum required for testing:**

- The `.env.example` file already has demo credentials
- You can use it as-is for local testing
- For production, add your own OAuth credentials

### Step 4: Build the TypeScript Code

**⚠️ IMPORTANT:** Omnistream is written in TypeScript and must be compiled to JavaScript before running.

```bash
npm run build
```

This compiles `src/**/*.ts` → `dist/**/*.js`

## ▶️ Running the Server

You have **two options** for running the server:

### Option 1: Development Mode (Recommended for Development)

```bash
npm run dev
```

**Benefits:**

- ✅ Auto-compiles TypeScript when files change
- ✅ Hot reload on code changes
- ✅ No separate build step needed
- ✅ Best for active development

### Option 2: Production Mode

```bash
# Build first (required!)
npm run build

# Then start
npm start
```

**Benefits:**

- ✅ Optimized for production
- ✅ Faster startup (no compilation)
- ✅ Use compiled JavaScript directly

## ✅ Verify It's Running

The server should start on `http://localhost:3000`

**Check the health endpoint:**

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2025-10-05T..." }
```

## 🔐 Complete OAuth to Go Live

To actually stream to YouTube and Facebook, you need to complete OAuth:

### Step 1: Run the Demo

```bash
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

### Step 3: Create a Stream

Once OAuth is completed, create a stream:

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

### Step 4: Stream Video

If you have a video file, use FFmpeg:

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

## 🌐 Access the Web Dashboard

The repository includes a browser-based demo dashboard.

### Setup Dashboard

**In a new terminal:**

```bash
# Navigate to dashboard directory
cd examples/web-dashboard

# Install dashboard dependencies
npm install

# Start the dashboard server
npm start
```

### Open in Browser

Navigate to: **http://localhost:4000**

The dashboard provides:

- Community creation & API key management
- OAuth platform connections
- Stream management UI
- Real-time stream controls

## 🧪 Run Tests

Verify everything works by running the test suite:

### API Tests

```bash
# Unit tests
npm test

# Integration tests (Playwright)
npm run test:integration

# End-to-end tests
npm run test:e2e
```

### Web Dashboard Tests

```bash
cd examples/web-dashboard

# Bash API tests (12 tests)
./test-dashboard.sh

# Playwright UI tests (16 tests)
npm test
```

**Expected result:** All 28 tests should pass ✅

## 🎬 Run Demos

Try the automated demos to see Omnistream in action:

### Simple API Demo

```bash
npm run demo:simple
```

Shows:

- Community creation
- OAuth URL generation
- Stream configuration
- All API endpoints

### Interactive Streaming Demo

```bash
npm run demo
```

Walks through:

- Creating a community
- Setting up OAuth
- Creating multi-platform streams
- Managing stream lifecycle

## 📊 What's Next?

Now that Omnistream is running, you can:

1. **Create a community** via API or web dashboard
2. **Complete OAuth** for YouTube/Facebook (click the generated URLs)
3. **Create streams** targeting multiple platforms
4. **Start streaming** with OBS or FFmpeg

## 🐛 Troubleshooting

### Error: "Cannot find module 'dist/index.js'"

**Problem:** TypeScript hasn't been compiled yet.

**Solution:**

```bash
npm run build    # Compile TypeScript
npm start        # Then run
```

**Or use dev mode:**

```bash
npm run dev      # Auto-compiles
```

### Error: "Port 3000 already in use"

**Solution:**

```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill
```

**Or change the port in `.env`:**

```bash
PORT=3001
```

### Error: "Cannot find module 'tsx'"

**Problem:** Dev dependencies not installed.

**Solution:**

```bash
npm install
```

### Dashboard won't start

**Problem:** Main Omnistream server not running or wrong port.

**Solution:**

```bash
# Terminal 1: Start main server
npm run dev

# Terminal 2: Start dashboard
cd examples/web-dashboard
npm start
```

Verify `OMNISTREAM_API_URL` in `examples/web-dashboard/.env`

### Tests fail with "ECONNREFUSED"

**Problem:** Server not running.

**Solution:**
Start the server first:

```bash
npm run dev
```

Then run tests in another terminal.

### OAuth URLs not working

- Make sure you're using the exact URLs from the demo output
- Check that redirect URIs match in Google/Facebook console
- Verify credentials in `.env` file

### "No OAuth tokens found" error

- This is expected until you complete OAuth in browser
- Click the authorization URLs and complete the flow
- Tokens are automatically stored after callback

## 📚 Next Steps

- **[README.md](../../README.md)** - Complete API documentation
- **[examples/web-dashboard/README.md](../../examples/web-dashboard/README.md)** - Dashboard documentation
- **[docs/guides/gigaverse-integration.md](./gigaverse-integration.md)** - Integration guide

## 🆘 Need Help?

- **GitHub Issues:** [Report a bug](https://github.com/gigaverse-app/omnistream/issues)
- **Documentation:** See all `.md` files in the repository
- **Tests:** Run `npm test` to verify your setup

---

**🎉 You're ready to stream! Start with the web dashboard at http://localhost:4000**
