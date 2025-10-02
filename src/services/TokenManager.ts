import { Platform, OAuthToken } from '../types';
import { ITokenManager } from '../interfaces';
import { PlatformProviderFactory } from '../providers';

export class TokenManager implements ITokenManager {
  private tokens: Map<string, Map<Platform, OAuthToken>> = new Map();
  
  private getKey(communityId: string, platform: Platform): string {
    return `${communityId}:${platform}`;
  }
  
  async saveToken(communityId: string, platform: Platform, token: OAuthToken): Promise<void> {
    if (!this.tokens.has(communityId)) {
      this.tokens.set(communityId, new Map());
    }
    
    this.tokens.get(communityId)!.set(platform, token);
    console.log(`[TokenManager] Saved token for community ${communityId} on platform ${platform}`);
  }
  
  async getToken(communityId: string, platform: Platform): Promise<OAuthToken | null> {
    const communityTokens = this.tokens.get(communityId);
    if (!communityTokens) {
      return null;
    }
    
    return communityTokens.get(platform) || null;
  }
  
  async refreshTokenIfNeeded(communityId: string, platform: Platform): Promise<OAuthToken> {
    const token = await this.getToken(communityId, platform);
    
    if (!token) {
      throw new Error(`No token found for community ${communityId} on platform ${platform}`);
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const now = Date.now();
    const expiresIn = token.expiresAt - now;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expiresIn > fiveMinutes) {
      return token;
    }
    
    // Token expired or about to expire, refresh it
    console.log(`[TokenManager] Refreshing token for community ${communityId} on platform ${platform}`);
    const provider = PlatformProviderFactory.getProvider(platform);
    const newToken = await provider.refreshToken(token);
    
    await this.saveToken(communityId, platform, newToken);
    return newToken;
  }
  
  async deleteToken(communityId: string, platform: Platform): Promise<void> {
    const communityTokens = this.tokens.get(communityId);
    if (communityTokens) {
      communityTokens.delete(platform);
      console.log(`[TokenManager] Deleted token for community ${communityId} on platform ${platform}`);
    }
  }
}
