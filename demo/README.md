# Omnistream Demo Applications

This directory contains demo applications that showcase the Omnistream multi-platform streaming capabilities.

## 🎯 Quick Start

### 1. Simple Automated Demo (No User Input Required)

The fastest way to verify the system is working:

```bash
# Make sure the Omnistream server is running
npm run dev

# In another terminal, run the automated demo
npx tsx demo/simple-demo.ts
```

This will automatically:
- ✅ Create a community
- ✅ Generate OAuth URLs for YouTube and Facebook
- ✅ Create a multi-platform stream configuration
- ✅ Test stream lifecycle (start/stop)
- ✅ Clean up resources

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║   🚀 OMNISTREAM - Simple Automated Demo                  ║
╚═══════════════════════════════════════════════════════════╝

1️⃣  Checking API health...
   ✅ API is healthy

2️⃣  Creating community...
   ✅ Community created

[... and so on ...]

╔═══════════════════════════════════════════════════════════╗
║   ✅ DEMO COMPLETED SUCCESSFULLY!                         ║
╚═══════════════════════════════════════════════════════════╝
```

### 2. Interactive Demo (Full Workflow with Video Streaming)

For a complete demonstration including actual video streaming:

```bash
# Make sure the Omnistream server is running
npm run dev

# In another terminal, run the interactive demo
npx tsx demo/demo-stream.ts
```

This interactive demo lets you:
- Create a community
- Set up OAuth for YouTube/Facebook (opens browser)
- Create a stream with custom title and description
- **Stream an actual video file using FFmpeg**
- Monitor stream status in real-time
- Stop and clean up

## 📋 Prerequisites

### Required
- Node.js 18+ and npm
- Omnistream server running (`npm run dev`)

### Optional (for video streaming)
- **FFmpeg** installed for actual video streaming
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt-get install ffmpeg`
  - Windows: Download from https://ffmpeg.org/download.html
- A video file (MP4, MOV, AVI, etc.) to stream
- Completed OAuth for YouTube and/or Facebook

## 🎥 Streaming a Real Video

### Step 1: Complete OAuth

Before you can stream to YouTube or Facebook, you need to authorize the app:

1. Run the demo: `npx tsx demo/demo-stream.ts`
2. When prompted, choose to set up OAuth
3. Open the provided URLs in your browser
4. Complete the authorization flow
5. Come back to the terminal

### Step 2: Prepare Your Video

Have a video file ready. For testing, you can use:
- Any MP4/MOV file from your computer
- Sample videos from https://sample-videos.com/
- Create a test video with your webcam

### Step 3: Stream

1. Run `npx tsx demo/demo-stream.ts`
2. Follow the prompts to create a stream
3. When asked about FFmpeg, choose "yes"
4. Provide the path to your video file
5. The demo will use FFmpeg to stream your video to YouTube/Facebook!

## 📊 What Each Demo Does

### simple-demo.ts
**Purpose:** Automated API testing without user interaction

**What it tests:**
- API health check
- Community creation
- OAuth URL generation
- Multi-platform stream creation
- Stream lifecycle (start/stop/delete)
- Error handling

**Use case:** Quick smoke test, CI/CD validation

### demo-stream.ts
**Purpose:** Full interactive demonstration with real video streaming

**What it demonstrates:**
- Complete OAuth flow
- Custom stream configuration
- FFmpeg integration for video streaming
- Real-time status monitoring
- Multi-platform broadcasting

**Use case:** Manual testing, demos to stakeholders, end-to-end validation

## 🔧 Troubleshooting

### "Connection refused" error
Make sure the Omnistream server is running:
```bash
npm run dev
```

### "OAuth tokens not found" error
Complete the OAuth flow by opening the authorization URLs in your browser.

### FFmpeg errors
- Verify FFmpeg is installed: `ffmpeg -version`
- Check your video file path is correct
- Ensure the video file is in a supported format (MP4, MOV, etc.)

### Platform-specific errors
- **YouTube:** Make sure you've enabled YouTube Data API v3 in Google Cloud Console
- **Facebook:** Ensure your app has "Facebook Login" product enabled
- Check your OAuth credentials in `.env` file

## 🌐 Environment Variables

The demos use these environment variables (from `.env`):

```bash
# API endpoint (default: http://localhost:3000)
API_BASE_URL=http://localhost:3000

# OAuth credentials (required for actual streaming)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

## 📖 Example Workflows

### Quick Validation Test
```bash
# Start server
npm run dev

# Run automated test in another terminal
npx tsx demo/simple-demo.ts
```

### Full Demo with Video Streaming
```bash
# Start server
npm run dev

# Run interactive demo
npx tsx demo/demo-stream.ts

# When prompted:
# 1. Choose platforms: youtube,facebook
# 2. Complete OAuth: y
# 3. Open URLs in browser and authorize
# 4. Enter stream title
# 5. Start stream: y
# 6. Stream video file: y
# 7. Enter path to your video file
# 8. Watch it go live on YouTube/Facebook!
```

### Testing Without OAuth (API Only)
```bash
# Run simple demo - works without OAuth
npx tsx demo/simple-demo.ts

# Streams will be created but won't go live
# Useful for testing API functionality only
```

## 📝 Notes

- The simple demo creates and deletes resources automatically
- The interactive demo leaves resources active for you to inspect
- Both demos require the Omnistream server to be running
- OAuth is optional for API testing but required for actual streaming
- FFmpeg is only needed if you want to stream actual video files

## 🎓 Next Steps

After running the demos:

1. **Explore the API** - Check `docs/API.md` for full endpoint documentation
2. **Build your own client** - Use the demo code as a reference
3. **Set up WebSocket chat** - Connect to `ws://localhost:3000/ws/chat`
4. **Deploy to production** - See `docs/DEPLOYMENT.md`

## 🆘 Support

If you encounter issues:
1. Check the logs in the Omnistream server terminal
2. Verify your `.env` configuration
3. Ensure all prerequisites are installed
4. Check the main README.md for setup instructions
