/**
 * Unit tests for OAuth configuration validator
 */

import { OAuthConfigValidator } from '../../../utils/oauth-config-validator.js';
import { config } from '../../../utils/config.js';

describe('OAuthConfigValidator', () => {
  describe('validate()', () => {
    it('should return validation results', () => {
      const result = OAuthConfigValidator.validate();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should validate redirect URIs are valid URLs', () => {
      const result = OAuthConfigValidator.validate();

      // In test environment, we should have valid URLs
      const urlErrors = result.errors.filter((e) => e.includes('not a valid URL'));
      expect(urlErrors.length).toBe(0);
    });

    it('should warn about GitHub Codespaces URLs', () => {
      // This is a regression test for the user's specific issue
      const originalYoutubeUri = config.youtube.redirectUri;

      // Temporarily set to a codespace URL to test the warning
      Object.defineProperty(config.youtube, 'redirectUri', {
        value: 'https://ubiquitous-space-acorn-59r6xxgxqp3v9p4-3000.app.github.dev/api/v1/auth/youtube/callback',
        writable: true,
        configurable: true,
      });

      const validationResult = OAuthConfigValidator.validate();

      // Should have a warning about GitHub Codespaces
      const codespaceWarnings = validationResult.warnings.filter((w) => w.includes('github.dev'));
      expect(codespaceWarnings.length).toBeGreaterThan(0);
      expect(codespaceWarnings[0]).toContain('This will only work within the Codespace');
      expect(codespaceWarnings[0]).toContain('For local development');

      // Restore original value
      Object.defineProperty(config.youtube, 'redirectUri', {
        value: originalYoutubeUri,
        writable: true,
        configurable: true,
      });
    });

    it('should validate redirect URI paths', () => {
      OAuthConfigValidator.validate();

      // YouTube redirect URI should end with correct path
      if (config.youtube.redirectUri) {
        const url = new URL(config.youtube.redirectUri);
        expect(url.pathname).toContain('/api/v1/auth/youtube/callback');
      }

      // Facebook redirect URI should end with correct path
      if (config.facebook.redirectUri) {
        const url = new URL(config.facebook.redirectUri);
        expect(url.pathname).toContain('/api/v1/auth/facebook/callback');
      }

      // TikTok redirect URI should end with correct path
      if (config.tiktok.redirectUri) {
        const url = new URL(config.tiktok.redirectUri);
        expect(url.pathname).toContain('/api/v1/auth/tiktok/callback');
      }
    });

    it('should warn about ngrok URLs', () => {
      const originalYoutubeUri = config.youtube.redirectUri;

      Object.defineProperty(config.youtube, 'redirectUri', {
        value: 'https://abc123.ngrok.io/api/v1/auth/youtube/callback',
        writable: true,
        configurable: true,
      });

      const result = OAuthConfigValidator.validate();

      const ngrokWarnings = result.warnings.filter((w) => w.includes('ngrok'));
      expect(ngrokWarnings.length).toBeGreaterThan(0);
      expect(ngrokWarnings[0]).toContain('tunneling service');

      Object.defineProperty(config.youtube, 'redirectUri', {
        value: originalYoutubeUri,
        writable: true,
        configurable: true,
      });
    });

    it('should error on localhost in production mode', () => {
      const originalEnv = config.nodeEnv;
      const originalYoutubeUri = config.youtube.redirectUri;

      Object.defineProperty(config, 'nodeEnv', {
        value: 'production',
        writable: true,
        configurable: true,
      });

      Object.defineProperty(config.youtube, 'redirectUri', {
        value: 'http://localhost:3000/api/v1/auth/youtube/callback',
        writable: true,
        configurable: true,
      });

      const result = OAuthConfigValidator.validate();

      const localhostErrors = result.errors.filter((e) => e.includes('localhost'));
      expect(localhostErrors.length).toBeGreaterThan(0);

      Object.defineProperty(config, 'nodeEnv', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(config.youtube, 'redirectUri', {
        value: originalYoutubeUri,
        writable: true,
        configurable: true,
      });
    });

    it('should require HTTPS in production', () => {
      const originalEnv = config.nodeEnv;
      const originalYoutubeUri = config.youtube.redirectUri;

      Object.defineProperty(config, 'nodeEnv', {
        value: 'production',
        writable: true,
        configurable: true,
      });

      Object.defineProperty(config.youtube, 'redirectUri', {
        value: 'http://example.com/api/v1/auth/youtube/callback',
        writable: true,
        configurable: true,
      });

      const result = OAuthConfigValidator.validate();

      const httpsErrors = result.errors.filter((e) => e.includes('must use HTTPS'));
      expect(httpsErrors.length).toBeGreaterThan(0);

      Object.defineProperty(config, 'nodeEnv', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(config.youtube, 'redirectUri', {
        value: originalYoutubeUri,
        writable: true,
        configurable: true,
      });
    });

    it('should warn when redirect URIs have different hostnames', () => {
      const originalYoutubeUri = config.youtube.redirectUri;
      const originalFacebookUri = config.facebook.redirectUri;

      Object.defineProperty(config.youtube, 'redirectUri', {
        value: 'http://localhost:3000/api/v1/auth/youtube/callback',
        writable: true,
        configurable: true,
      });

      Object.defineProperty(config.facebook, 'redirectUri', {
        value: 'https://example.com/api/v1/auth/facebook/callback',
        writable: true,
        configurable: true,
      });

      const result = OAuthConfigValidator.validate();

      const hostnameWarnings = result.warnings.filter((w) =>
        w.includes('use different hostnames')
      );
      expect(hostnameWarnings.length).toBeGreaterThan(0);

      Object.defineProperty(config.youtube, 'redirectUri', {
        value: originalYoutubeUri,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(config.facebook, 'redirectUri', {
        value: originalFacebookUri,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('validateAndLog()', () => {
    it('should return boolean indicating validity', () => {
      const result = OAuthConfigValidator.validateAndLog();
      expect(typeof result).toBe('boolean');
    });

    it('should not throw errors even with invalid config', () => {
      expect(() => OAuthConfigValidator.validateAndLog()).not.toThrow();
    });
  });
});
