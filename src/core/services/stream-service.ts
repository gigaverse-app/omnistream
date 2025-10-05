/**
 * Stream service - Business logic for managing streams across platforms
 */

import {
  StreamConfig,
  PlatformStream,
  Platform,
  StreamStatus,
} from "../interfaces.js";
import { db } from "../../database/index.js";
import { providerRegistry } from "../../providers/index.js";
import { logger } from "../../utils/logger.js";
import { ValidationError, NotFoundError } from "../errors.js";

export class StreamService {
  /**
   * Create a new multi-platform stream
   */
  async createStream(
    communityId: string,
    streamData: {
      title: string;
      description?: string;
      scheduledStartTime?: Date;
      rtmpUrl: string;
      rtmpKey: string;
      platforms: Platform[];
    },
  ): Promise<{ stream: StreamConfig; platformStreams: PlatformStream[] }> {
    // Validate community exists
    await db.getCommunityById(communityId);

    // Validate platforms
    if (!streamData.platforms || streamData.platforms.length === 0) {
      throw new ValidationError("At least one platform must be specified");
    }

    // Create stream record
    const stream = await db.createStream({
      communityId,
      title: streamData.title,
      description: streamData.description,
      scheduledStartTime: streamData.scheduledStartTime,
      rtmpUrl: streamData.rtmpUrl,
      rtmpKey: streamData.rtmpKey,
      platforms: streamData.platforms,
    });

    // Create stream on each platform
    const platformStreams: PlatformStream[] = [];
    for (const platform of streamData.platforms) {
      try {
        const provider = providerRegistry.getProvider(platform);
        const tokens = await db.getOAuthTokens(communityId, platform);

        const platformStream = await provider.createStream(
          communityId,
          stream,
          tokens.tokens,
        );
        await db.savePlatformStream(stream.id, platformStream);
        platformStreams.push(platformStream);

        logger.info("Platform stream created", {
          streamId: stream.id,
          platform,
          platformStreamId: platformStream.platformStreamId,
        });
      } catch (error) {
        logger.error(`Failed to create stream on ${platform}`, error);
        // Continue with other platforms (graceful degradation)
        platformStreams.push({
          platform,
          platformStreamId: "",
          status: StreamStatus.ERROR,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { stream, platformStreams };
  }

  /**
   * Start a stream on all platforms
   */
  async startStream(
    streamId: string,
    communityId: string,
  ): Promise<PlatformStream[]> {
    const stream = await db.getStream(streamId);

    // Verify ownership
    if (stream.communityId !== communityId) {
      throw new NotFoundError("Stream not found");
    }

    const platformStreams = await db.getPlatformStreams(streamId);
    const results: PlatformStream[] = [];

    for (const platformStream of platformStreams) {
      try {
        const provider = providerRegistry.getProvider(platformStream.platform);
        const tokens = await db.getOAuthTokens(
          communityId,
          platformStream.platform,
        );

        const updated = await provider.startStream(
          platformStream.platformStreamId,
          tokens.tokens,
        );
        await db.savePlatformStream(streamId, updated);
        results.push(updated);

        logger.info("Platform stream started", {
          streamId,
          platform: platformStream.platform,
        });
      } catch (error) {
        logger.error(
          `Failed to start stream on ${platformStream.platform}`,
          error,
        );
        results.push({
          ...platformStream,
          status: StreamStatus.ERROR,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Stop a stream on all platforms
   */
  async stopStream(
    streamId: string,
    communityId: string,
  ): Promise<PlatformStream[]> {
    const stream = await db.getStream(streamId);

    if (stream.communityId !== communityId) {
      throw new NotFoundError("Stream not found");
    }

    const platformStreams = await db.getPlatformStreams(streamId);
    const results: PlatformStream[] = [];

    for (const platformStream of platformStreams) {
      try {
        const provider = providerRegistry.getProvider(platformStream.platform);
        const tokens = await db.getOAuthTokens(
          communityId,
          platformStream.platform,
        );

        const updated = await provider.stopStream(
          platformStream.platformStreamId,
          tokens.tokens,
        );
        await db.savePlatformStream(streamId, updated);
        results.push(updated);

        logger.info("Platform stream stopped", {
          streamId,
          platform: platformStream.platform,
        });
      } catch (error) {
        logger.error(
          `Failed to stop stream on ${platformStream.platform}`,
          error,
        );
        results.push({
          ...platformStream,
          status: StreamStatus.ERROR,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Get stream status from all platforms
   */
  async getStreamStatus(
    streamId: string,
    communityId: string,
  ): Promise<{ stream: StreamConfig; platformStreams: PlatformStream[] }> {
    const stream = await db.getStream(streamId);

    if (stream.communityId !== communityId) {
      throw new NotFoundError("Stream not found");
    }

    const platformStreams = await db.getPlatformStreams(streamId);
    const results: PlatformStream[] = [];

    for (const platformStream of platformStreams) {
      try {
        const provider = providerRegistry.getProvider(platformStream.platform);
        const tokens = await db.getOAuthTokens(
          communityId,
          platformStream.platform,
        );

        const updated = await provider.getStreamStatus(
          platformStream.platformStreamId,
          tokens.tokens,
        );
        await db.savePlatformStream(streamId, updated);
        results.push(updated);
      } catch (error) {
        logger.error(
          `Failed to get stream status on ${platformStream.platform}`,
          error,
        );
        results.push({
          ...platformStream,
          status: StreamStatus.ERROR,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { stream, platformStreams: results };
  }

  /**
   * List all streams for a community
   */
  async listStreams(communityId: string): Promise<StreamConfig[]> {
    await db.getCommunityById(communityId);
    return db.listStreamsByCommunity(communityId);
  }

  /**
   * Delete a stream
   */
  async deleteStream(streamId: string, communityId: string): Promise<void> {
    const stream = await db.getStream(streamId);

    if (stream.communityId !== communityId) {
      throw new NotFoundError("Stream not found");
    }

    await db.deleteStream(streamId);
    logger.info("Stream deleted", { streamId, communityId });
  }
}

export const streamService = new StreamService();
