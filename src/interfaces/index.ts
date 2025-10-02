import {
  Platform,
  OAuthToken,
  StreamConfig,
  ChatMessage,
  StreamMetadata
} from '../types';

export interface IPlatformProvider {
  readonly platform: Platform;
  
  // OAuth methods
  getAuthUrl(communityId: string, redirectUri: string): string;
  exchangeCodeForToken(code: string): Promise<OAuthToken>;
  refreshToken(token: OAuthToken): Promise<OAuthToken>;
  
  // Stream management
  createStream(
    token: OAuthToken,
    title: string,
    description?: string,
    scheduledStartTime?: Date
  ): Promise<{ streamId: string; rtmpUrl: string; streamKey: string }>;
  
  startStream(token: OAuthToken, streamId: string): Promise<void>;
  endStream(token: OAuthToken, streamId: string): Promise<void>;
  getStreamStatus(token: OAuthToken, streamId: string): Promise<StreamMetadata>;
  
  // Chat methods
  getRecentMessages(
    token: OAuthToken,
    streamId: string,
    limit?: number
  ): Promise<ChatMessage[]>;
  
  postMessage(
    token: OAuthToken,
    streamId: string,
    message: string
  ): Promise<ChatMessage>;
  
  pinMessage(
    token: OAuthToken,
    streamId: string,
    messageId: string
  ): Promise<void>;
  
  highlightMessage(
    token: OAuthToken,
    streamId: string,
    messageId: string
  ): Promise<void>;
}

export interface ITokenManager {
  saveToken(communityId: string, platform: Platform, token: OAuthToken): Promise<void>;
  getToken(communityId: string, platform: Platform): Promise<OAuthToken | null>;
  refreshTokenIfNeeded(communityId: string, platform: Platform): Promise<OAuthToken>;
  deleteToken(communityId: string, platform: Platform): Promise<void>;
}

export interface IStreamService {
  createStream(
    communityId: string,
    config: Partial<StreamConfig>
  ): Promise<StreamConfig>;
  
  getStream(streamId: string): Promise<StreamConfig | null>;
  getStreamsByCommunity(communityId: string): Promise<StreamConfig[]>;
  
  startStream(streamId: string): Promise<void>;
  endStream(streamId: string): Promise<void>;
  
  getStreamStatus(streamId: string): Promise<StreamMetadata[]>;
}

export interface IChatService {
  getMessages(
    streamId: string,
    platform?: Platform,
    limit?: number
  ): Promise<ChatMessage[]>;
  
  postMessage(
    streamId: string,
    platforms: Platform[],
    message: string
  ): Promise<ChatMessage[]>;
  
  pinMessage(
    streamId: string,
    platform: Platform,
    messageId: string
  ): Promise<void>;
  
  highlightMessage(
    streamId: string,
    platform: Platform,
    messageId: string
  ): Promise<void>;
}
