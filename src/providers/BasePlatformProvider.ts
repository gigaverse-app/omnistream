import {
  Platform,
  OAuthToken,
  ChatMessage,
  StreamMetadata
} from '../types';
import { IPlatformProvider } from '../interfaces';

export abstract class BasePlatformProvider implements IPlatformProvider {
  abstract readonly platform: Platform;
  
  protected handleError(error: unknown, operation: string): never {
    console.error(`[${this.platform}] Error during ${operation}:`, error);
    throw new Error(`${this.platform} provider error: ${operation} failed`);
  }
  
  protected async executeWithGracefulDegradation<T>(
    operation: () => Promise<T>,
    fallback: T,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.warn(`[${this.platform}] ${operationName} failed, using fallback:`, error);
      return fallback;
    }
  }
  
  abstract getAuthUrl(communityId: string, redirectUri: string): string;
  abstract exchangeCodeForToken(code: string): Promise<OAuthToken>;
  abstract refreshToken(token: OAuthToken): Promise<OAuthToken>;
  
  abstract createStream(
    token: OAuthToken,
    title: string,
    description?: string,
    scheduledStartTime?: Date
  ): Promise<{ streamId: string; rtmpUrl: string; streamKey: string }>;
  
  abstract startStream(token: OAuthToken, streamId: string): Promise<void>;
  abstract endStream(token: OAuthToken, streamId: string): Promise<void>;
  abstract getStreamStatus(token: OAuthToken, streamId: string): Promise<StreamMetadata>;
  
  abstract getRecentMessages(
    token: OAuthToken,
    streamId: string,
    limit?: number
  ): Promise<ChatMessage[]>;
  
  abstract postMessage(
    token: OAuthToken,
    streamId: string,
    message: string
  ): Promise<ChatMessage>;
  
  abstract pinMessage(
    token: OAuthToken,
    streamId: string,
    messageId: string
  ): Promise<void>;
  
  abstract highlightMessage(
    token: OAuthToken,
    streamId: string,
    messageId: string
  ): Promise<void>;
}
