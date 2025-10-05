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

**Windows PowerShell:**
```powershell
npm run build
```

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

**Windows PowerShell:**
```powershell
npm run dev
```

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

**Windows PowerShell:**
```powershell
npm run build
npm start
```

## ✅ Verify It's Running

The server should start on `http://localhost:3000`

**Check the health endpoint:**

```bash
curl http://localhost:3000/health
```

**Windows PowerShell:**
```powershell
Invoke-WebRequest http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-05T..."}
```

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

**Windows PowerShell:**
```powershell
cd examples\web-dashboard
npm install
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
# Linux/Mac:
lsof -ti:3000 | xargs kill

# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
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

## 📚 Next Steps

- **[README.md](./README.md)** - Complete API documentation
- **[QUICK_START.md](./QUICK_START.md)** - OAuth setup and streaming guide
- **[examples/web-dashboard/README.md](./examples/web-dashboard/README.md)** - Dashboard documentation
- **[GIGAVERSE_INTEGRATION_GUIDE.md](./GIGAVERSE_INTEGRATION_GUIDE.md)** - Integration guide

## 🆘 Need Help?

- **GitHub Issues:** [Report a bug](https://github.com/gigaverse-app/omnistream/issues)
- **Documentation:** See all `.md` files in the repository
- **Tests:** Run `npm test` to verify your setup

---

**🎉 You're ready to stream! Start with the web dashboard at http://localhost:4000**
