/**
 * Unit tests for YouTube provider
 */

import { YouTubeProvider } from "../../../providers/youtube/index.js";
import { Platform, StreamStatus } from "../../../core/interfaces.js";
import { PlatformError } from "../../../core/errors.js";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("YouTubeProvider", () => {
  let provider: YouTubeProvider;

  beforeEach(() => {
    provider = new YouTubeProvider();
    jest.clearAllMocks();
  });

  describe("platform", () => {
    it("should return YOUTUBE platform", () => {
      expect(provider.platform).toBe(Platform.YOUTUBE);
    });
  });

  describe("getAuthUrl", () => {
    it("should generate valid OAuth URL", () => {
      const url = provider.getAuthUrl(
        "community-123",
        "http://localhost:3000/callback",
      );

      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("client_id=");
      expect(url).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback",
      );
      expect(url).toContain("state=community-123");
      expect(url).toContain("scope=");
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("should exchange code for tokens successfully", async () => {
      const mockResponse = {
        data: {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          expires_in: 3600,
          scope: "https://www.googleapis.com/auth/youtube.force-ssl",
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const tokens = await provider.exchangeCodeForTokens(
        "auth-code",
        "http://localhost:3000/callback",
      );

      expect(tokens.accessToken).toBe("test-access-token");
      expect(tokens.refreshToken).toBe("test-refresh-token");
      expect(tokens.scope).toEqual([
        "https://www.googleapis.com/auth/youtube.force-ssl",
      ]);
      expect(tokens.expiresAt).toBeInstanceOf(Date);
    });

    it("should throw PlatformError on failure", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("API error"));

      await expect(
        provider.exchangeCodeForTokens(
          "auth-code",
          "http://localhost:3000/callback",
        ),
      ).rejects.toThrow(PlatformError);
    });
  });

  describe("refreshTokens", () => {
    it("should refresh tokens successfully", async () => {
      const mockResponse = {
        data: {
          access_token: "new-access-token",
          expires_in: 3600,
          scope: "https://www.googleapis.com/auth/youtube.force-ssl",
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const tokens = await provider.refreshTokens("refresh-token");

      expect(tokens.accessToken).toBe("new-access-token");
      expect(tokens.refreshToken).toBe("refresh-token");
    });
  });

  describe("createStream", () => {
    it("should create stream successfully", async () => {
      const mockBroadcastResponse = {
        data: { id: "broadcast-123" },
      };

      const mockStreamResponse = {
        data: { id: "stream-456" },
      };

      mockedAxios.post
        .mockResolvedValueOnce(mockBroadcastResponse)
        .mockResolvedValueOnce(mockStreamResponse)
        .mockResolvedValueOnce({});

      const streamConfig = {
        id: "stream-id",
        communityId: "community-123",
        title: "Test Stream",
        description: "Test Description",
        rtmpUrl: "rtmp://example.com",
        rtmpKey: "stream-key",
        platforms: [Platform.YOUTUBE],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 3600000),
        scope: ["youtube.force-ssl"],
      };

      const result = await provider.createStream(
        "community-123",
        streamConfig,
        tokens,
      );

      expect(result.platform).toBe(Platform.YOUTUBE);
      expect(result.platformStreamId).toBe("broadcast-123");
      expect(result.status).toBe(StreamStatus.SCHEDULED);
      expect(result.streamUrl).toContain("broadcast-123");
    });
  });

  describe("getStreamStatus", () => {
    it("should return correct status for live stream", async () => {
      const mockResponse = {
        data: {
          items: [
            {
              status: { lifeCycleStatus: "live" },
              statistics: { concurrentViewers: "100" },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const tokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 3600000),
        scope: ["youtube.force-ssl"],
      };

      const result = await provider.getStreamStatus("broadcast-123", tokens);

      expect(result.status).toBe(StreamStatus.LIVE);
      expect(result.viewerCount).toBe(100);
    });
  });
});
