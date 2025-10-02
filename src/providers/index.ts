import { Platform } from '../types';
import { IPlatformProvider } from '../interfaces';
import { YouTubeProvider } from './YouTubeProvider';
import { FacebookProvider } from './FacebookProvider';
import { TikTokProvider } from './TikTokProvider';
import { InstagramProvider } from './InstagramProvider';

export class PlatformProviderFactory {
  private static providers: Map<Platform, IPlatformProvider> = new Map();
  
  static getProvider(platform: Platform): IPlatformProvider {
    if (!this.providers.has(platform)) {
      switch (platform) {
        case Platform.YOUTUBE:
          this.providers.set(platform, new YouTubeProvider());
          break;
        case Platform.FACEBOOK:
          this.providers.set(platform, new FacebookProvider());
          break;
        case Platform.TIKTOK:
          this.providers.set(platform, new TikTokProvider());
          break;
        case Platform.INSTAGRAM:
          this.providers.set(platform, new InstagramProvider());
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    }
    
    return this.providers.get(platform)!;
  }
  
  static getAllProviders(): IPlatformProvider[] {
    return Object.values(Platform).map(platform => this.getProvider(platform));
  }
}
