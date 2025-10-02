import { Platform, StreamConfig, StreamStatus, StreamMetadata } from '../types';
import { IStreamService, ITokenManager } from '../interfaces';
import { PlatformProviderFactory } from '../providers';
import { generateId } from '../utils/generateId';

export class StreamService implements IStreamService {
  private streams: Map<string, StreamConfig> = new Map();
  private platformStreamIds: Map<string, Map<Platform, string>> = new Map();
  
  constructor(private tokenManager: ITokenManager) {}
  
  async createStream(
    communityId: string,
    config: Partial<StreamConfig>
  ): Promise<StreamConfig> {
    const streamId = generateId('stream');
    const now = new Date();
    
    const streamConfig: StreamConfig = {
      id: streamId,
      communityId,
      title: config.title || 'Untitled Stream',
      description: config.description,
      platforms: config.platforms || [],
      rtmpCredentials: config.rtmpCredentials || {
        url: '',
        key: ''
      },
      scheduledStartTime: config.scheduledStartTime,
      status: StreamStatus.SCHEDULED,
      createdAt: now,
      updatedAt: now
    };
    
    // Create streams on each platform
    const platformStreamIds = new Map<Platform, string>();
    
    for (const platform of streamConfig.platforms) {
      try {
        const token = await this.tokenManager.refreshTokenIfNeeded(communityId, platform);
        const provider = PlatformProviderFactory.getProvider(platform);
        
        const result = await provider.createStream(
          token,
          streamConfig.title,
          streamConfig.description,
          streamConfig.scheduledStartTime
        );
        
        platformStreamIds.set(platform, result.streamId);
        
        // Use the first platform's RTMP credentials if not provided
        if (!streamConfig.rtmpCredentials.url) {
          streamConfig.rtmpCredentials = {
            url: result.rtmpUrl,
            key: result.streamKey
          };
        }
        
        console.log(`[StreamService] Created stream on ${platform}: ${result.streamId}`);
      } catch (error) {
        console.error(`[StreamService] Failed to create stream on ${platform}:`, error);
        // Continue with other platforms (graceful degradation)
      }
    }
    
    this.streams.set(streamId, streamConfig);
    this.platformStreamIds.set(streamId, platformStreamIds);
    
    return streamConfig;
  }
  
  async getStream(streamId: string): Promise<StreamConfig | null> {
    return this.streams.get(streamId) || null;
  }
  
  async getStreamsByCommunity(communityId: string): Promise<StreamConfig[]> {
    return Array.from(this.streams.values()).filter(
      stream => stream.communityId === communityId
    );
  }
  
  async startStream(streamId: string): Promise<void> {
    const stream = await this.getStream(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }
    
    const platformStreamIds = this.platformStreamIds.get(streamId);
    if (!platformStreamIds) {
      throw new Error(`No platform stream IDs found for stream ${streamId}`);
    }
    
    for (const [platform, platformStreamId] of platformStreamIds) {
      try {
        const token = await this.tokenManager.refreshTokenIfNeeded(stream.communityId, platform);
        const provider = PlatformProviderFactory.getProvider(platform);
        
        await provider.startStream(token, platformStreamId);
        console.log(`[StreamService] Started stream on ${platform}`);
      } catch (error) {
        console.error(`[StreamService] Failed to start stream on ${platform}:`, error);
        // Continue with other platforms (graceful degradation)
      }
    }
    
    stream.status = StreamStatus.LIVE;
    stream.updatedAt = new Date();
  }
  
  async endStream(streamId: string): Promise<void> {
    const stream = await this.getStream(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }
    
    const platformStreamIds = this.platformStreamIds.get(streamId);
    if (!platformStreamIds) {
      throw new Error(`No platform stream IDs found for stream ${streamId}`);
    }
    
    for (const [platform, platformStreamId] of platformStreamIds) {
      try {
        const token = await this.tokenManager.refreshTokenIfNeeded(stream.communityId, platform);
        const provider = PlatformProviderFactory.getProvider(platform);
        
        await provider.endStream(token, platformStreamId);
        console.log(`[StreamService] Ended stream on ${platform}`);
      } catch (error) {
        console.error(`[StreamService] Failed to end stream on ${platform}:`, error);
        // Continue with other platforms (graceful degradation)
      }
    }
    
    stream.status = StreamStatus.ENDED;
    stream.updatedAt = new Date();
  }
  
  async getStreamStatus(streamId: string): Promise<StreamMetadata[]> {
    const stream = await this.getStream(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }
    
    const platformStreamIds = this.platformStreamIds.get(streamId);
    if (!platformStreamIds) {
      return [];
    }
    
    const statuses: StreamMetadata[] = [];
    
    for (const [platform, platformStreamId] of platformStreamIds) {
      try {
        const token = await this.tokenManager.refreshTokenIfNeeded(stream.communityId, platform);
        const provider = PlatformProviderFactory.getProvider(platform);
        
        const status = await provider.getStreamStatus(token, platformStreamId);
        statuses.push(status);
      } catch (error) {
        console.error(`[StreamService] Failed to get stream status on ${platform}:`, error);
        // Continue with other platforms (graceful degradation)
      }
    }
    
    return statuses;
  }
}
