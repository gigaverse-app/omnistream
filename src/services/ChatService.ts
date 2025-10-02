import { Platform, ChatMessage } from '../types';
import { IChatService, ITokenManager } from '../interfaces';
import { PlatformProviderFactory } from '../providers';

export class ChatService implements IChatService {
  private streamPlatformIds: Map<string, Map<Platform, string>> = new Map();
  
  constructor(private tokenManager: ITokenManager) {}
  
  setPlatformStreamId(streamId: string, platform: Platform, platformStreamId: string): void {
    if (!this.streamPlatformIds.has(streamId)) {
      this.streamPlatformIds.set(streamId, new Map());
    }
    this.streamPlatformIds.get(streamId)!.set(platform, platformStreamId);
  }
  
  async getMessages(
    streamId: string,
    platform?: Platform,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    const platformStreamIds = this.streamPlatformIds.get(streamId);
    if (!platformStreamIds) {
      return [];
    }
    
    const platforms = platform 
      ? [platform] 
      : Array.from(platformStreamIds.keys());
    
    const allMessages: ChatMessage[] = [];
    
    for (const plat of platforms) {
      const platformStreamId = platformStreamIds.get(plat);
      if (!platformStreamId) continue;
      
      try {
        const provider = PlatformProviderFactory.getProvider(plat);
        // For now, we'll use a dummy communityId - in production this should be tracked
        const token = await this.tokenManager.getToken('dummy', plat);
        if (!token) continue;
        
        const messages = await provider.getRecentMessages(token, platformStreamId, limit);
        allMessages.push(...messages);
      } catch (error) {
        console.error(`[ChatService] Failed to get messages from ${plat}:`, error);
        // Continue with other platforms (graceful degradation)
      }
    }
    
    // Sort by timestamp
    return allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async postMessage(
    streamId: string,
    platforms: Platform[],
    message: string
  ): Promise<ChatMessage[]> {
    const platformStreamIds = this.streamPlatformIds.get(streamId);
    if (!platformStreamIds) {
      return [];
    }
    
    const postedMessages: ChatMessage[] = [];
    
    for (const platform of platforms) {
      const platformStreamId = platformStreamIds.get(platform);
      if (!platformStreamId) continue;
      
      try {
        const provider = PlatformProviderFactory.getProvider(platform);
        // For now, we'll use a dummy communityId - in production this should be tracked
        const token = await this.tokenManager.getToken('dummy', platform);
        if (!token) continue;
        
        const postedMessage = await provider.postMessage(token, platformStreamId, message);
        postedMessages.push(postedMessage);
      } catch (error) {
        console.error(`[ChatService] Failed to post message to ${platform}:`, error);
        // Continue with other platforms (graceful degradation)
      }
    }
    
    return postedMessages;
  }
  
  async pinMessage(
    streamId: string,
    platform: Platform,
    messageId: string
  ): Promise<void> {
    const platformStreamIds = this.streamPlatformIds.get(streamId);
    if (!platformStreamIds) {
      throw new Error(`Stream ${streamId} not found`);
    }
    
    const platformStreamId = platformStreamIds.get(platform);
    if (!platformStreamId) {
      throw new Error(`Platform ${platform} not found for stream ${streamId}`);
    }
    
    try {
      const provider = PlatformProviderFactory.getProvider(platform);
      // For now, we'll use a dummy communityId - in production this should be tracked
      const token = await this.tokenManager.getToken('dummy', platform);
      if (!token) {
        throw new Error(`No token found for platform ${platform}`);
      }
      
      await provider.pinMessage(token, platformStreamId, messageId);
    } catch (error) {
      console.error(`[ChatService] Failed to pin message on ${platform}:`, error);
      throw error;
    }
  }
  
  async highlightMessage(
    streamId: string,
    platform: Platform,
    messageId: string
  ): Promise<void> {
    const platformStreamIds = this.streamPlatformIds.get(streamId);
    if (!platformStreamIds) {
      throw new Error(`Stream ${streamId} not found`);
    }
    
    const platformStreamId = platformStreamIds.get(platform);
    if (!platformStreamId) {
      throw new Error(`Platform ${platform} not found for stream ${streamId}`);
    }
    
    try {
      const provider = PlatformProviderFactory.getProvider(platform);
      // For now, we'll use a dummy communityId - in production this should be tracked
      const token = await this.tokenManager.getToken('dummy', platform);
      if (!token) {
        throw new Error(`No token found for platform ${platform}`);
      }
      
      await provider.highlightMessage(token, platformStreamId, messageId);
    } catch (error) {
      console.error(`[ChatService] Failed to highlight message on ${platform}:`, error);
      throw error;
    }
  }
}
