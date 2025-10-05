# Database Architecture & Migration Guide

## Current State: In-Memory Database

### What's Stored in the Database

The application currently uses an **in-memory database** implemented as JavaScript Maps in `src/database/index.ts`. The following data is stored:

#### 1. **Communities**
- `id` (UUID)
- `name` (string)
- `apiKey` (string, format: `omni_<64-char-hex>`)
- `createdAt` (Date)
- `updatedAt` (Date)

**Purpose**: Represents organizations/users using Omnistream. Each community gets an API key for authentication.

#### 2. **OAuth Tokens** (Community-specific)
- `communityId` (foreign key to Community)
- `platform` (enum: youtube, facebook, tiktok)
- `tokens` (object containing):
  - `accessToken`
  - `refreshToken` (optional)
  - `expiresAt`
  - `scope` (array)
- `updatedAt` (Date)

**Purpose**: Stores OAuth credentials for each platform per community. Required to create/manage streams on platforms.

#### 3. **Stream Configurations**
- `id` (UUID)
- `communityId` (foreign key to Community)
- `title` (string)
- `description` (string, optional)
- `rtmpUrl` (string) - Where Omnistream receives video
- `rtmpKey` (string) - Stream key for RTMP input
- `platforms` (array: youtube, facebook, tiktok)
- `scheduledStartTime` (Date, optional)
- `createdAt` (Date)
- `updatedAt` (Date)

**Purpose**: Central stream configuration that defines how a stream should be distributed across platforms.

#### 4. **Platform Streams** (Per-stream, per-platform)
- `platform` (enum: youtube, facebook, tiktok)
- `platformStreamId` (string) - ID from the platform (e.g., YouTube broadcast ID)
- `status` (enum: idle, starting, live, stopping, error)
- `viewerCount` (number, optional)
- `platformUrl` (string, optional) - URL to watch on platform
- `error` (string, optional)

**Purpose**: Tracks the status of each stream on each platform. Links Omnistream streams to platform-specific streams.

#### 5. **Chat Messages**
- `id` (UUID)
- `streamId` (foreign key to StreamConfig)
- `platform` (enum: youtube, facebook, tiktok)
- `platformMessageId` (string) - Original message ID from platform
- `authorId` (string)
- `authorName` (string)
- `authorImageUrl` (string, optional)
- `message` (string)
- `timestamp` (Date)
- `metadata` (object, optional) - Platform-specific data

**Purpose**: Aggregates chat messages from all platforms for unified chat display.

### Current Limitations

❌ **Data is lost on restart** - All communities, streams, and chat history disappear when the server stops
❌ **No persistence** - Cannot recover from crashes
❌ **Single instance only** - Cannot scale horizontally (multiple servers would have separate databases)
❌ **No data analytics** - Cannot query historical data
❌ **Security risk** - OAuth tokens stored in memory could be exposed

---

## When to Migrate to PostgreSQL

### Migrate When:

✅ **Moving to production** - Data persistence is critical
✅ **Need scalability** - Running multiple server instances
✅ **Require data analytics** - Want to analyze stream performance, viewer trends
✅ **Long-term OAuth storage** - Need reliable token refresh across restarts
✅ **Chat history** - Want to preserve and search historical chat messages
✅ **Compliance/security** - Need encrypted storage, backups, audit logs

### Can Stay In-Memory For:

✅ **Development/testing** - Current setup works fine
✅ **Demos and POCs** - Temporary environments
✅ **Single-user/short-lived sessions** - If data loss on restart is acceptable

---

## How to Migrate to PostgreSQL

### Option 1: Database Schema (Recommended for Production)

```sql
-- Communities table
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_communities_api_key ON communities(api_key);

-- OAuth tokens table
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    tokens JSONB NOT NULL, -- Encrypted in production
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(community_id, platform)
);

CREATE INDEX idx_oauth_tokens_community ON oauth_tokens(community_id);

-- Streams table
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    rtmp_url VARCHAR(500) NOT NULL,
    rtmp_key VARCHAR(500) NOT NULL,
    platforms TEXT[] NOT NULL,
    scheduled_start_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_streams_community ON streams(community_id);

-- Platform streams table
CREATE TABLE platform_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_stream_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    viewer_count INTEGER,
    platform_url VARCHAR(500),
    error TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(stream_id, platform)
);

CREATE INDEX idx_platform_streams_stream ON platform_streams(stream_id);
CREATE INDEX idx_platform_streams_status ON platform_streams(status);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_message_id VARCHAR(255),
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_image_url VARCHAR(500),
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_stream ON chat_messages(stream_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_chat_messages_stream_timestamp ON chat_messages(stream_id, timestamp);
```

### Option 2: Migration Steps

1. **Install PostgreSQL Client**
   ```bash
   npm install pg @types/pg
   ```

2. **Create Database Adapter Interface**
   ```typescript
   // src/database/interface.ts
   export interface DatabaseAdapter {
     // Community methods
     createCommunity(name: string): Promise<Community>;
     getCommunityById(id: string): Promise<Community>;
     getCommunityByApiKey(apiKey: string): Promise<Community>;
     listCommunities(): Promise<Community[]>;

     // OAuth methods
     saveOAuthTokens(tokens: CommunityOAuthTokens): Promise<void>;
     getOAuthTokens(communityId: string, platform: Platform): Promise<CommunityOAuthTokens>;
     deleteOAuthTokens(communityId: string, platform: Platform): Promise<void>;

     // Stream methods
     createStream(config: Omit<StreamConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<StreamConfig>;
     getStream(id: string): Promise<StreamConfig>;
     updateStream(id: string, updates: Partial<StreamConfig>): Promise<StreamConfig>;
     listStreamsByCommunity(communityId: string): Promise<StreamConfig[]>;
     deleteStream(id: string): Promise<void>;

     // Platform stream methods
     savePlatformStream(streamId: string, platformStream: PlatformStream): Promise<void>;
     getPlatformStreams(streamId: string): Promise<PlatformStream[]>;
     getPlatformStream(streamId: string, platform: Platform): Promise<PlatformStream | undefined>;

     // Chat methods
     saveChatMessage(message: ChatMessage): Promise<void>;
     addChatMessage(data: Omit<ChatMessage, 'id'>): Promise<ChatMessage>;
     getChatMessages(streamId: string, since?: Date): Promise<ChatMessage[]>;
     updateChatMessage(streamId: string, messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage>;
   }
   ```

3. **Implement PostgreSQL Adapter**
   ```typescript
   // src/database/postgres.ts
   import { Pool } from 'pg';
   import { DatabaseAdapter } from './interface.js';

   export class PostgresDatabase implements DatabaseAdapter {
     private pool: Pool;

     constructor(connectionString: string) {
       this.pool = new Pool({ connectionString });
     }

     async createCommunity(name: string): Promise<Community> {
       const apiKey = `omni_${crypto.randomBytes(32).toString('hex')}`;
       const result = await this.pool.query(
         'INSERT INTO communities (name, api_key) VALUES ($1, $2) RETURNING *',
         [name, apiKey]
       );
       return this.mapCommunity(result.rows[0]);
     }

     // ... implement other methods
   }
   ```

4. **Update Database Factory**
   ```typescript
   // src/database/index.ts
   import { config } from '../utils/config.js';
   import { InMemoryDatabase } from './in-memory.js';
   import { PostgresDatabase } from './postgres.js';

   export const db = config.databaseUrl.startsWith('postgresql://')
     ? new PostgresDatabase(config.databaseUrl)
     : new InMemoryDatabase();
   ```

5. **Run Migrations**
   ```bash
   # Option A: Use migration tool
   npm install node-pg-migrate
   npx node-pg-migrate create initial-schema
   npx node-pg-migrate up

   # Option B: Run SQL directly
   psql $DATABASE_URL -f migrations/001-initial-schema.sql
   ```

6. **Update docker-compose.yml** (already configured!)
   ```bash
   docker-compose up -d postgres
   ```

7. **Set Environment Variable**
   ```bash
   # .env
   DATABASE_URL=postgresql://omnistream:changeme@localhost:5432/omnistream
   ```

### Option 3: Gradual Migration Strategy

For zero-downtime migration:

1. **Dual-write phase**: Write to both in-memory and PostgreSQL
2. **Backfill phase**: Copy existing in-memory data to PostgreSQL
3. **Read from PostgreSQL**: Switch reads to PostgreSQL while still dual-writing
4. **Cut over**: Stop writing to in-memory, PostgreSQL becomes primary

---

## Data Ownership: Application vs. Omnistream

This is a **critical architectural decision** that depends on your use case:

### Option 1: Omnistream Owns the Data (Current Design)
**Best for: SaaS model where Omnistream is a managed service**

✅ **Pros:**
- Omnistream manages all data, OAuth tokens, stream configurations
- Applications using Omnistream just use the API
- Centralized management and monitoring
- Easier multi-tenancy

❌ **Cons:**
- Application depends on Omnistream's database availability
- Less control for application developers
- Data residency/compliance may be an issue
- Potential vendor lock-in

**Implementation:**
```
┌─────────────────┐
│   Your App      │
│                 │
└────────┬────────┘
         │ API calls
         ▼
┌─────────────────┐      ┌──────────────┐
│   Omnistream    │─────▶│  PostgreSQL  │
│   (Middleware)  │      │  (Owned by   │
│                 │      │  Omnistream) │
└─────────────────┘      └──────────────┘
```

### Option 2: Application Owns the Data (Embedded/Library Mode)
**Best for: Self-hosted, white-label, or embedded solutions**

✅ **Pros:**
- Full data control and ownership
- No external dependencies for data
- Can customize schema for specific needs
- Better for compliance/data residency

❌ **Cons:**
- Application responsible for database setup/maintenance
- More complex integration
- Each application needs separate OAuth setup

**Implementation:**
```
┌─────────────────────────────────┐
│   Your App                      │
│                                 │
│  ┌─────────────┐  ┌───────────┐│
│  │ Omnistream  │  │PostgreSQL ││
│  │  (Library)  │─▶│ (Yours)   ││
│  └─────────────┘  └───────────┘│
└─────────────────────────────────┘
```

**To implement this, you'd need:**
```typescript
// src/database/custom-adapter.ts
// Application provides its own database adapter
import { OmnistreamServer } from 'omnistream';

const server = new OmnistreamServer({
  database: myApplicationDatabase, // Implements DatabaseAdapter
  // ... other config
});
```

### Option 3: Hybrid Model (Recommended)
**Best for: Flexibility and multiple deployment scenarios**

Omnistream stores:
- OAuth tokens (security/refresh logic)
- Platform stream state (real-time status)
- Chat message aggregation (temporary buffer)

Application stores:
- Stream metadata (titles, descriptions)
- User/community information
- Business logic data
- Historical analytics

**Implementation:**
- Use Omnistream API for streaming operations
- Application maintains its own database for business data
- Webhook callbacks to sync critical events

```
┌────────────────────────┐
│   Your App             │
│                        │
│  ┌──────────────────┐  │      ┌──────────────────┐
│  │  App Database    │  │      │  Omnistream      │
│  │  (Business Data) │  │      │                  │
│  └──────────────────┘  │      │  ┌────────────┐  │
│                        │◀─────┤  │ OAuth +    │  │
│                        │ API  │  │ Stream DB  │  │
└────────────────────────┘      │  └────────────┘  │
                                └──────────────────┘
```

---

## Recommendations

### For Development (Current):
✅ Keep in-memory database - it's simple and works great for testing

### For Production:
1. **Migrate to PostgreSQL** using the schema and migration steps above
2. **Use Omnistream-owned data model** if building a SaaS platform
3. **Use Hybrid model** if building a product where apps need data ownership
4. **Encrypt OAuth tokens** in database (use `pgcrypto` or application-level encryption)
5. **Set up regular backups** for PostgreSQL
6. **Enable SSL** for database connections
7. **Use connection pooling** (pg-pool or PgBouncer)

### Security Considerations:
- ⚠️ **Never log OAuth tokens** - already handled in error middleware
- 🔐 **Encrypt tokens at rest** - use PostgreSQL `pgcrypto` or AWS KMS
- 🔄 **Implement token rotation** - refresh OAuth tokens before expiry
- 📝 **Audit logging** - track who accessed what data
- 🗑️ **Data retention** - auto-delete old chat messages to save space

### Performance Optimization:
- Add indices on frequently queried fields (already in schema above)
- Use materialized views for analytics
- Partition chat_messages table by date if storing large volumes
- Consider Redis for caching frequently accessed data (e.g., active stream status)

---

## Migration Checklist

- [ ] Choose data ownership model (Omnistream-owned vs. App-owned vs. Hybrid)
- [ ] Set up PostgreSQL (local, Docker, or cloud provider)
- [ ] Run database schema migrations
- [ ] Install `pg` package
- [ ] Implement PostgresDatabase adapter
- [ ] Update database factory to use PostgreSQL when `DATABASE_URL` is set
- [ ] Add connection pooling configuration
- [ ] Implement OAuth token encryption
- [ ] Set up database backups
- [ ] Update tests to handle PostgreSQL (separate test database)
- [ ] Add database health checks
- [ ] Document database setup for deployments
- [ ] Plan data retention/cleanup policies

---

## Testing with PostgreSQL

Update `jest.config.js` to support database tests:

```javascript
// jest.config.js
export default {
  // ... existing config
  globalSetup: './src/__tests__/setup.ts',
  globalTeardown: './src/__tests__/teardown.ts',
};
```

```typescript
// src/__tests__/setup.ts
import { Pool } from 'pg';

export default async function setup() {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    // Run migrations
    await pool.query('CREATE TABLE IF NOT EXISTS ...');
    await pool.end();
  }
}
```

```typescript
// src/__tests__/teardown.ts
export default async function teardown() {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await pool.end();
  }
}
```
