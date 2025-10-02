import { BasePlatformProvider } from './BasePlatformProvider';
import {
  Platform,
  OAuthToken,
  ChatMessage,
  StreamMetadata,
  StreamStatus
} from '../types';
import { config } from '../config';

export class TikTokProvider extends BasePlatformProvider {
  readonly platform = Platform.TIKTOK;
  
  getAuthUrl(communityId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_key: config.tiktok.clientId,
      redirect_uri: redirectUri,
      state: communityId,
      scope: 'user.info.basic,video.upload,live.room.info'
    });
    
    return `https://www.tiktok.com/auth/authorize?${params.toString()}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    return {
      accessToken: `tt_access_${code}`,
      refreshToken: `tt_refresh_${code}`,
      expiresAt: Date.now() + 86400000, // 24 hours
      platform: Platform.TIKTOK,
      scope: ['user.info.basic', 'video.upload', 'live.room.info']
    };
  }
  
  async refreshToken(token: OAuthToken): Promise<OAuthToken> {
    return {
      ...token,
      accessToken: `tt_access_refreshed_${Date.now()}`,
      expiresAt: Date.now() + 86400000
    };
  }
  
  async createStream(
    _token: OAuthToken,
    _title: string,
    _description?: string,
    _scheduledStartTime?: Date
  ): Promise<{ streamId: string; rtmpUrl: string; streamKey: string }> {
    const streamId = `tt_stream_${Date.now()}`;
    const streamKey = `tt_key_${Math.random().toString(36).substring(7)}`;
    
    return {
      streamId,
      rtmpUrl: 'rtmp://push.tiktok.com/live/',
      streamKey
    };
  }
  
  async startStream(token: OAuthToken, streamId: string): Promise<void> {
    console.log(`[TikTok] Starting stream ${streamId}`);
  }
  
  async endStream(token: OAuthToken, streamId: string): Promise<void> {
    console.log(`[TikTok] Ending stream ${streamId}`);
  }
  
  async getStreamStatus(token: OAuthToken, streamId: string): Promise<StreamMetadata> {
    return {
      platform: Platform.TIKTOK,
      streamId,
      platformStreamId: streamId,
      viewerCount: 0,
      status: StreamStatus.SCHEDULED
    };
  }
  
  async getRecentMessages(
    token: OAuthToken,
    streamId: string,
    _limit: number = 50
  ): Promise<ChatMessage[]> {
    return [];
  }
  
  async postMessage(
    token: OAuthToken,
    streamId: string,
    message: string
  ): Promise<ChatMessage> {
    return {
      id: `tt_msg_${Date.now()}`,
      platform: Platform.TIKTOK,
      streamId,
      author: {
        id: 'bot',
        name: 'OmniStream Bot'
      },
      content: message,
      timestamp: new Date(),
      isPinned: false,
      isHighlighted: false
    };
  }
  
  async pinMessage(
    token: OAuthToken,
    streamId: string,
    messageId: string
  ): Promise<void> {
    console.log(`[TikTok] Pinning message ${messageId} in stream ${streamId}`);
  }
  
  async highlightMessage(
    token: OAuthToken,
    streamId: string,
    messageId: string
  ): Promise<void> {
    console.log(`[TikTok] Highlighting message ${messageId} in stream ${streamId}`);
  }
}
