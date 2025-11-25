# OmniStream Home Assignment

## Full-Stack Developer Assessment

**Company:** Gigaverse
**Duration:** 2 weeks
**Deadline:** December 9th, 2024

---

## Overview

This assignment evaluates your ability to work with unfamiliar technologies, integrate complex APIs, and deliver a functional product using modern development tools including AI assistants.

You will build a **demo application** that showcases multi-platform social media management using the OmniStream library. The goal is to create a unified interface where users can authenticate with multiple social platforms and perform actions (post, schedule, stream, chat) across all of them with single API calls.

---

## Background

### What is OmniStream?

OmniStream is a TypeScript/Node.js middleware that provides RESTful APIs for multi-platform social media operations. It currently supports:

| Platform  | OAuth | Streams | Chat | Status |
|-----------|-------|---------|------|--------|
| YouTube   | ✅    | ✅      | ✅   | Fully Supported |
| Facebook  | ✅    | ✅      | ✅   | Fully Supported |
| TikTok    | ⚠️    | ⚠️      | ⚠️   | Requires API Approval |
| Instagram | ❌    | ❌      | ❌   | No Official API |

**Repository:** https://github.com/gigaverse-app/omnistream

The library is approximately **70% complete**. You are expected to extend, modify, and improve it as needed.
The desired output is a working fork of omnistream library, with a demo app that demonstrates the use of it.

---

## Assignment Requirements

### 1. Fork and Extend OmniStream

Fork the OmniStream repository and extend it to support:

- **TikTok** - Posting, streaming (where API allows)
- **Telegram** - Posting to channels/groups
- **Instagram** - Posting (via Facebook Graph API or available methods)
- **Facebook** - Already partially supported, ensure full functionality
- **X (Twitter)** - Posting, and potentially streaming to X Spaces
- **YouTube** - Already supported, ensure full functionality

### 2. Build a Demo Application

Create a demo web application that demonstrates OmniStream's capabilities:

#### Core Features

| Feature | Description |
|---------|-------------|
| **User Registration** | Users can create accounts on your demo app |
| **Multi-User Support** | The app stores different tokens for different users in a database |
| **Platform Authentication** | Users can provide OAuth tokens for each social platform (NOT passwords) |
| **Unified Posting** | Write once, post to all connected platforms with a single action |
| **Event Scheduling** | Schedule events on platforms that support it (YouTube, Facebook) |
| **Live Streaming** | Stream to multiple platforms simultaneously |
| **Chat Aggregation** | View and send chat messages across all live platforms in real-time |

#### User Flow

```
1. User visits your demo app website
2. User registers/logs in to your demo app
3. User connects social platforms by providing OAuth tokens
4. User performs actions:
   a. Write a post → Published to all connected platforms with posting
   b. Schedule an event → Created on all platforms with event support
   c. Start a livestream → Streamed to all platforms with streaming support
   d. Chat during stream → Messages aggregated from all platforms
```

### 3. Technical Requirements

| Requirement | Details |
|-------------|---------|
| **Language** | TypeScript (strict mode) |
| **Frontend** | React |
| **API Design** | Platform-agnostic REST API |
| **Database** | Store user accounts and platform tokens |
| **Authentication** | Secure token storage (encrypted at rest) |
| **Architecture** | Clean separation between OmniStream library and demo app |

#### Platform-Agnostic API Design

The key architectural requirement is that **consumers of OmniStream should not need to know platform-specific details**.

**Example - Creating a Post:**

```typescript
// GOOD: Platform-agnostic
POST /api/posts
{
  "content": "Hello world!",
  "media": ["image.jpg"],
  "platforms": ["all"] // or ["youtube", "facebook", "tiktok"]
}

// BAD: Platform-specific
POST /api/facebook/posts
POST /api/twitter/posts
// etc.
```

**Example - Starting a Stream:**

```typescript
// GOOD: Platform-agnostic
POST /api/streams/start
{
  "title": "My Live Stream",
  "description": "Join me live!",
  "platforms": ["all"]
}

// Returns unified stream info with platform-specific RTMP URLs
```

---

## Deliverables

### Required

1. **Forked OmniStream Repository** with your modifications
2. **Demo Application** (can be in the same repo or separate)
3. **Working Deployment** OR clear local setup instructions
4. **README** with:
   - Setup instructions
   - Architecture overview
   - What works, what's stubbed, what's not implemented
   - Known limitations

### Evaluation Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| **Functionality** | 30% | Does it work? Can you demo the core features? |
| **Code Quality** | 25% | Clean, readable, maintainable TypeScript |
| **Architecture** | 20% | Good separation of concerns, platform-agnostic design |
| **Understanding** | 15% | Can you explain your code and decisions? |
| **Completeness** | 10% | How much of the spec did you accomplish? |

---

## Platform-Specific Notes

### YouTube
- Use YouTube Live Streaming API
- Already well-supported in OmniStream
- Supports: OAuth, streaming, chat, scheduling

### Facebook
- Use Facebook Graph API
- Supports: OAuth, streaming, chat, page posts, events

### TikTok
- Requires TikTok for Developers API access
- Limited API availability - do what's possible
- Focus on: posting, basic streaming if available

### Instagram
- No official live streaming API
- Posting available via Facebook Graph API (Business accounts)
- Document limitations clearly

### X (Twitter)
- Use X API v2
- Supports: OAuth 2.0, posting, Spaces (audio streaming)
- Note rate limits

### Telegram
- Use Telegram Bot API
- Supports: Channel posts, group messages
- Bot must be admin of channel/group

---

## Scope Guidance

### This is a 2-week assignment. Prioritize accordingly:

**Must Have:**
- User registration and login
- Token storage for at least 2-3 platforms
- Unified posting to connected platforms (that support it)
- Basic error handling
- Event scheduling across platforms (that support it)
- Live streaming across platforms (that support it)
- Basic chat send/receive across platforms

**Nice to Have:**
- Full chat integration with send/receive
- Polished UI
- Comprehensive error handling
- Additional platform support


### Acceptable Shortcuts

- **Focus on happy path** - Basic error handling is sufficient
- Unit and integration tests

---

## AI Usage Policy

**You may (and are encouraged to) use AI tools** including Claude, ChatGPT, GitHub Copilot, etc.

However:

1. **You must understand your code** - Be prepared to explain any part of the codebase
2. **You must be able to debug** - If something breaks, you need to fix it
3. **Maintain code quality** - AI-generated code should be reviewed and cleaned up
4. **No copy-paste without comprehension** - Understand what you're implementing

*This assignment is designed to be achievable in 2 weeks WITH AI assistance. Without AI, this would be a month-long senior developer task.*

---

## Submission

1. Push your code to your forked repository
2. Ensure the repository is public or share access
3. Include a `SUBMISSION.md` with:
   - Link to live demo (if deployed)
   - Setup instructions for local testing
   - Summary of what you implemented
   - Any notes or explanations

---

## Questions?

If you have questions about the assignment:

1. Check the existing OmniStream documentation in `/docs`
2. Review the existing codebase for patterns and examples
3. Make reasonable assumptions and document them
4. Reach out to your contact at Gigaverse if blocked

---

## What We're Really Looking For

This assignment tests:

- **Learning Ability** - Can you pick up unfamiliar technologies quickly?
- **Problem Solving** - How do you handle incomplete information and APIs?
- **Code Quality** - Can you write clean, maintainable code?
- **System Design** - Do you understand API design and architecture?
- **AI Fluency** - Can you effectively leverage AI tools?
- **Communication** - Can you explain what you built and why?

**Partial completion with excellent quality beats full completion with poor quality.**

Focus on doing fewer things well rather than many things poorly.

---

## Getting Started

```bash
# 1. Fork the repository on GitHub
# https://github.com/gigaverse-app/omnistream

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/omnistream.git
cd omnistream

# 3. Install dependencies
npm install

# 4. Copy environment template
cp .env.example .env

# 5. Start the development server
npm run dev

# 6. Explore the existing web dashboard
cd examples/web-dashboard
npm install
npm start
# Open http://localhost:4000

# 7. Read the existing documentation
# - /docs/guides/getting-started.md
# - /docs/guides/database-architecture.md
# - /README.md
```

---

**Good luck! We look forward to seeing what you build.**

*— The Gigaverse Team*
