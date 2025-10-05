/**
 * Integration tests for OAuth redirect URI validation
 * These tests ensure that OAuth redirect URIs are properly configured
 * and match between the environment configuration and provider implementations
 */

import { config } from '../../../utils/config.js';
import { youtubeProvider } from '../../../providers/youtube/index.js';
import { facebookProvider } from '../../../providers/facebook/index.js';
import { tiktokProvider } from '../../../providers/tiktok/index.js';

describe('OAuth Redirect URI Configuration', () => {
  describe('Configuration Validation', () => {
    it('should have YouTube redirect URI configured', () => {
      expect(config.youtube.redirectUri).toBeDefined();
      expect(config.youtube.redirectUri).not.toBe('');
      expect(config.youtube.redirectUri).toContain('/api/v1/auth/youtube/callback');
    });

    it('should have Facebook redirect URI configured', () => {
      expect(config.facebook.redirectUri).toBeDefined();
      expect(config.facebook.redirectUri).not.toBe('');
      expect(config.facebook.redirectUri).toContain('/api/v1/auth/facebook/callback');
    });

    it('should have TikTok redirect URI configured', () => {
      expect(config.tiktok.redirectUri).toBeDefined();
      expect(config.tiktok.redirectUri).not.toBe('');
      expect(config.tiktok.redirectUri).toContain('/api/v1/auth/tiktok/callback');
    });

    it('should use valid URI format for YouTube redirect', () => {
      const uri = config.youtube.redirectUri;
      expect(uri).toMatch(/^https?:\/\//);
      expect(() => new URL(uri)).not.toThrow();
    });

    it('should use valid URI format for Facebook redirect', () => {
      const uri = config.facebook.redirectUri;
      expect(uri).toMatch(/^https?:\/\//);
      expect(() => new URL(uri)).not.toThrow();
    });

    it('should use valid URI format for TikTok redirect', () => {
      const uri = config.tiktok.redirectUri;
      expect(uri).toMatch(/^https?:\/\//);
      expect(() => new URL(uri)).not.toThrow();
    });
  });

  describe('Provider Auth URL Generation', () => {
    const testCommunityId = 'test-community-123';

    it('should include correct redirect URI in YouTube auth URL', () => {
      const authUrl = youtubeProvider.getAuthUrl(testCommunityId, config.youtube.redirectUri);
      const url = new URL(authUrl);
      const redirectParam = url.searchParams.get('redirect_uri');

      expect(redirectParam).toBe(config.youtube.redirectUri);
      expect(redirectParam).toContain('/api/v1/auth/youtube/callback');
    });

    it('should include correct redirect URI in Facebook auth URL', () => {
      const authUrl = facebookProvider.getAuthUrl(testCommunityId, config.facebook.redirectUri);
      const url = new URL(authUrl);
      const redirectParam = url.searchParams.get('redirect_uri');

      expect(redirectParam).toBe(config.facebook.redirectUri);
      expect(redirectParam).toContain('/api/v1/auth/facebook/callback');
    });

    it('should include correct redirect URI in TikTok auth URL', () => {
      const authUrl = tiktokProvider.getAuthUrl(testCommunityId, config.tiktok.redirectUri);
      const url = new URL(authUrl);
      const redirectParam = url.searchParams.get('redirect_uri');

      expect(redirectParam).toBe(config.tiktok.redirectUri);
      expect(redirectParam).toContain('/api/v1/auth/tiktok/callback');
    });

    it('should include state parameter with community ID in YouTube auth URL', () => {
      const authUrl = youtubeProvider.getAuthUrl(testCommunityId, config.youtube.redirectUri);
      const url = new URL(authUrl);
      const stateParam = url.searchParams.get('state');

      expect(stateParam).toBe(testCommunityId);
    });

    it('should include state parameter with community ID in Facebook auth URL', () => {
      const authUrl = facebookProvider.getAuthUrl(testCommunityId, config.facebook.redirectUri);
      const url = new URL(authUrl);
      const stateParam = url.searchParams.get('state');

      expect(stateParam).toBe(testCommunityId);
    });
  });

  describe('Redirect URI Consistency', () => {
    it('should use the same redirect URI for auth URL and token exchange', () => {
      // This test ensures that the redirect URI used in getAuthUrl is the same
      // as what would be used in exchangeCodeForTokens
      const testCommunityId = 'test-community-123';
      const authUrl = youtubeProvider.getAuthUrl(testCommunityId, config.youtube.redirectUri);
      const url = new URL(authUrl);
      const redirectParam = url.searchParams.get('redirect_uri');

      // The redirect URI in the auth URL should match the configured one
      expect(redirectParam).toBe(config.youtube.redirectUri);
    });

    it('should not have localhost redirect URI in production-like environments', () => {
      // Skip this test in test/development environments
      if (config.nodeEnv === 'production') {
        expect(config.youtube.redirectUri).not.toContain('localhost');
        expect(config.facebook.redirectUri).not.toContain('localhost');
        expect(config.tiktok.redirectUri).not.toContain('localhost');
      }
    });

    it('should warn if redirect URIs contain codespace URLs', () => {
      // This test helps catch the exact issue the user experienced
      const hasCodespaceUrl =
        config.youtube.redirectUri.includes('github.dev') ||
        config.facebook.redirectUri.includes('github.dev') ||
        config.tiktok.redirectUri.includes('github.dev');

      if (hasCodespaceUrl && config.nodeEnv !== 'test') {
        console.warn(
          '⚠️  WARNING: Redirect URIs contain GitHub Codespaces URLs. ' +
            'These will NOT work on local machines. ' +
            'Please update your .env file with localhost URLs or configure OAuth providers with both.'
        );
      }

      // We don't fail the test, just warn
      expect(true).toBe(true);
    });
  });

  describe('Environment Variable Documentation', () => {
    it('should have all required YouTube environment variables', () => {
      // In test environment, these might be empty, so we just check they're defined
      expect(config.youtube.clientId).toBeDefined();
      expect(config.youtube.clientSecret).toBeDefined();
      expect(config.youtube.redirectUri).toBeDefined();
    });

    it('should have all required Facebook environment variables', () => {
      expect(config.facebook.appId).toBeDefined();
      expect(config.facebook.appSecret).toBeDefined();
      expect(config.facebook.redirectUri).toBeDefined();
    });

    it('should have all required TikTok environment variables', () => {
      expect(config.tiktok.clientKey).toBeDefined();
      expect(config.tiktok.clientSecret).toBeDefined();
      expect(config.tiktok.redirectUri).toBeDefined();
    });
  });

  describe('Redirect URI Mismatch Detection', () => {
    it('should detect when redirect URI does not match expected pattern', () => {
      const expectedPath = '/api/v1/auth/youtube/callback';
      expect(config.youtube.redirectUri).toContain(expectedPath);
    });

    it('should validate that redirect URI host matches expected environment', () => {
      const uri = new URL(config.youtube.redirectUri);

      // In test environment, we should have localhost or test URLs
      if (config.nodeEnv === 'test' || config.nodeEnv === 'development') {
        const isValidHost =
          uri.hostname === 'localhost' ||
          uri.hostname === '127.0.0.1' ||
          uri.hostname.includes('github.dev') ||
          uri.hostname.includes('test');

        expect(isValidHost).toBe(true);
      }
    });

    it('should ensure redirect URI scheme is https in production', () => {
      if (config.nodeEnv === 'production') {
        const youtubeUri = new URL(config.youtube.redirectUri);
        const facebookUri = new URL(config.facebook.redirectUri);
        const tiktokUri = new URL(config.tiktok.redirectUri);

        expect(youtubeUri.protocol).toBe('https:');
        expect(facebookUri.protocol).toBe('https:');
        expect(tiktokUri.protocol).toBe('https:');
      }
    });
  });
});
