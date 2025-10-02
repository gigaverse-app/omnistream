export enum Platform {
  YOUTUBE = 'youtube',
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
  INSTAGRAM = 'instagram'
}

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  ERROR = 'error'
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string[];
  platform: Platform;
}

export interface Community {
  id: string;
  name: string;
  tokens: Map<Platform, OAuthToken>;
}

export interface RTMPCredentials {
  url: string;
  key: string;
}

export interface StreamConfig {
  id: string;
  communityId: string;
  title: string;
  description?: string;
  platforms: Platform[];
  rtmpCredentials: RTMPCredentials;
  scheduledStartTime?: Date;
  status: StreamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  platform: Platform;
  streamId: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  timestamp: Date;
  isPinned: boolean;
  isHighlighted: boolean;
}

export interface StreamMetadata {
  platform: Platform;
  streamId: string;
  platformStreamId: string;
  viewerCount?: number;
  status: StreamStatus;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
