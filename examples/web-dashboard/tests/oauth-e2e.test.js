const { test, expect } = require('@playwright/test');
require('dotenv').config({ path: '../../../.env' });

/**
 * Full OAuth E2E Test
 *
 * This test validates the complete end-to-end flow:
 * 1. Create a new community
 * 2. Authenticate with YouTube via OAuth
 * 3. Authenticate with Facebook via OAuth
 * 4. Create a new livestream
 * 5. Start the livestream to both platforms
 * 6. Verify stream is active on both platforms
 *
 * REQUIREMENTS:
 * - You must provide test account credentials in .env:
 *   - E2E_TEST_YOUTUBE_EMAIL
 *   - E2E_TEST_YOUTUBE_PASSWORD
 *   - E2E_TEST_FACEBOOK_EMAIL
 *   - E2E_TEST_FACEBOOK_PASSWORD
 * - YouTube and Facebook OAuth apps must be configured with proper redirect URIs
 * - Test will be SKIPPED if credentials are not provided
 */

// Validate required credentials
const hasYouTubeCredentials =
  process.env.E2E_TEST_YOUTUBE_EMAIL && process.env.E2E_TEST_YOUTUBE_PASSWORD;
const hasFacebookCredentials =
  process.env.E2E_TEST_FACEBOOK_EMAIL && process.env.E2E_TEST_FACEBOOK_PASSWORD;
const skipTests = process.env.SKIP_OAUTH_E2E_TESTS === 'true';

const shouldSkipTest = skipTests || !hasYouTubeCredentials || !hasFacebookCredentials;

if (shouldSkipTest) {
  console.log('\n⚠️  SKIPPING OAuth E2E Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (skipTests) {
    console.log('Reason: SKIP_OAUTH_E2E_TESTS is set to true');
  } else {
    console.log('Reason: Missing required test credentials in .env file\n');
    console.log('Required environment variables:');
    if (!hasYouTubeCredentials) {
      console.log('  ❌ E2E_TEST_YOUTUBE_EMAIL');
      console.log('  ❌ E2E_TEST_YOUTUBE_PASSWORD');
    } else {
      console.log('  ✅ E2E_TEST_YOUTUBE_EMAIL');
      console.log('  ✅ E2E_TEST_YOUTUBE_PASSWORD');
    }

    if (!hasFacebookCredentials) {
      console.log('  ❌ E2E_TEST_FACEBOOK_EMAIL');
      console.log('  ❌ E2E_TEST_FACEBOOK_PASSWORD');
    } else {
      console.log('  ✅ E2E_TEST_FACEBOOK_EMAIL');
      console.log('  ✅ E2E_TEST_FACEBOOK_PASSWORD');
    }

    console.log('\nTo run this test:');
    console.log('  1. Create test accounts for YouTube and Facebook');
    console.log('  2. Add credentials to /workspaces/omnistream/.env');
    console.log('  3. Re-run the tests\n');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

test.describe('Full OAuth E2E Flow', () => {
  test.skip(shouldSkipTest, 'Skipping - missing credentials or explicitly disabled');

  let communityName;
  let communityId;

  test.beforeEach(async ({ page }) => {
    communityName = `E2E Test Community ${Date.now()}`;
  });

  test('should complete full OAuth flow: create community → connect YT & FB → create & start stream', async ({
    page,
    context,
  }) => {
    // =========================================================================
    // STEP 1: Create a new community
    // =========================================================================
    console.log('\n[E2E] Step 1: Creating community...');
    await page.goto('/');

    // Fill in community name and create
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');

    // Wait for profile section to appear
    await page.waitForSelector('#profile-section', { state: 'visible', timeout: 10000 });

    // Verify community created
    await expect(page.locator('#profile-section')).toBeVisible();
    await expect(page.locator('#profile-name')).toContainText(communityName);

    // Extract community ID for later use
    const communityIdElement = page.locator('#profile-id');
    const communityIdText = await communityIdElement.textContent();
    communityId = communityIdText.trim();

    console.log(`[E2E] ✅ Community created: ${communityId}`);

    // =========================================================================
    // STEP 2: Connect to YouTube via OAuth
    // =========================================================================
    console.log('[E2E] Step 2: Connecting to YouTube...');

    // Wait for platforms section to load
    await page.waitForSelector('#platforms-section', { state: 'visible' });

    // Find YouTube platform card
    const youtubePlatform = page.locator('.platform-card').filter({ hasText: 'youtube' }).first();
    await expect(youtubePlatform).toBeVisible();

    // Verify YouTube is not connected initially
    await expect(youtubePlatform.locator('.platform-status')).toContainText('Not Connected');

    // Click Connect button for YouTube
    const youtubeConnectButton = youtubePlatform.locator('button:has-text("Connect")');
    await expect(youtubeConnectButton).toBeVisible();

    // Listen for popup
    const youtubePopupPromise = context.waitForEvent('page');
    await youtubeConnectButton.click();
    const youtubePopup = await youtubePopupPromise;

    // Wait for YouTube OAuth page to load
    await youtubePopup.waitForLoadState('domcontentloaded');

    console.log('[E2E] Authenticating with YouTube...');

    // Handle YouTube OAuth flow
    try {
      // Wait for email input
      const emailSelector = 'input[type="email"]';
      await youtubePopup.waitForSelector(emailSelector, { timeout: 15000 });
      await youtubePopup.fill(emailSelector, process.env.E2E_TEST_YOUTUBE_EMAIL);

      // Click Next
      await youtubePopup.click('button:has-text("Next"), #identifierNext');
      await youtubePopup.waitForTimeout(2000);

      // Wait for password input
      const passwordSelector = 'input[type="password"]';
      await youtubePopup.waitForSelector(passwordSelector, { timeout: 15000 });
      await youtubePopup.fill(passwordSelector, process.env.E2E_TEST_YOUTUBE_PASSWORD);

      // Click Next/Sign in
      await youtubePopup.click('button:has-text("Next"), #passwordNext');
      await youtubePopup.waitForTimeout(2000);

      // Handle consent screen if it appears
      // Google may show "Continue" or "Allow" buttons
      try {
        await youtubePopup.waitForSelector(
          'button:has-text("Continue"), button:has-text("Allow")',
          {
            timeout: 5000,
          }
        );
        await youtubePopup.click('button:has-text("Continue"), button:has-text("Allow")');
      } catch (e) {
        console.log('[E2E] No consent screen or already consented');
      }

      // Wait for popup to close (callback redirects and closes window)
      await youtubePopup.waitForEvent('close', { timeout: 15000 });
      console.log('[E2E] ✅ YouTube OAuth popup closed');
    } catch (error) {
      console.error('[E2E] ❌ YouTube OAuth failed:', error.message);
      throw error;
    }

    // Wait a moment for the main page to update
    await page.waitForTimeout(2000);

    // Reload platforms to verify YouTube is now connected
    await page.reload();
    await page.waitForSelector('#platforms-section', { state: 'visible' });

    const youtubeConnectedPlatform = page
      .locator('.platform-card')
      .filter({ hasText: 'youtube' })
      .first();
    await expect(youtubeConnectedPlatform.locator('.platform-status')).toContainText('Connected', {
      timeout: 10000,
    });

    console.log('[E2E] ✅ YouTube connected successfully');

    // =========================================================================
    // STEP 3: Connect to Facebook via OAuth
    // =========================================================================
    console.log('[E2E] Step 3: Connecting to Facebook...');

    // Find Facebook platform card
    const facebookPlatform = page.locator('.platform-card').filter({ hasText: 'facebook' }).first();
    await expect(facebookPlatform).toBeVisible();

    // Verify Facebook is not connected initially
    await expect(facebookPlatform.locator('.platform-status')).toContainText('Not Connected');

    // Click Connect button for Facebook
    const facebookConnectButton = facebookPlatform.locator('button:has-text("Connect")');
    await expect(facebookConnectButton).toBeVisible();

    // Listen for popup
    const facebookPopupPromise = context.waitForEvent('page');
    await facebookConnectButton.click();
    const facebookPopup = await facebookPopupPromise;

    // Wait for Facebook OAuth page to load
    await facebookPopup.waitForLoadState('domcontentloaded');

    console.log('[E2E] Authenticating with Facebook...');

    // Handle Facebook OAuth flow
    try {
      // Check if already logged in (session exists)
      const isContinueButtonVisible = await facebookPopup
        .locator('button:has-text("Continue as")')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (isContinueButtonVisible) {
        console.log('[E2E] Facebook session exists, clicking Continue...');
        await facebookPopup.click('button:has-text("Continue as")');
      } else {
        // Need to log in
        console.log('[E2E] Logging into Facebook...');

        // Fill email
        const emailSelector = 'input[name="email"], input[id="email"]';
        await facebookPopup.waitForSelector(emailSelector, { timeout: 10000 });
        await facebookPopup.fill(emailSelector, process.env.E2E_TEST_FACEBOOK_EMAIL);

        // Fill password
        const passwordSelector = 'input[name="pass"], input[id="pass"]';
        await facebookPopup.fill(passwordSelector, process.env.E2E_TEST_FACEBOOK_PASSWORD);

        // Click login
        await facebookPopup.click('button[name="login"], button[type="submit"]');
        await facebookPopup.waitForTimeout(3000);

        // Handle "Continue as" if shown after login
        try {
          await facebookPopup.waitForSelector('button:has-text("Continue as")', { timeout: 5000 });
          await facebookPopup.click('button:has-text("Continue as")');
        } catch (e) {
          console.log('[E2E] No additional Continue button');
        }
      }

      // Wait for popup to close (callback redirects and closes window)
      await facebookPopup.waitForEvent('close', { timeout: 15000 });
      console.log('[E2E] ✅ Facebook OAuth popup closed');
    } catch (error) {
      console.error('[E2E] ❌ Facebook OAuth failed:', error.message);
      throw error;
    }

    // Wait a moment for the main page to update
    await page.waitForTimeout(2000);

    // Reload platforms to verify Facebook is now connected
    await page.reload();
    await page.waitForSelector('#platforms-section', { state: 'visible' });

    const facebookConnectedPlatform = page
      .locator('.platform-card')
      .filter({ hasText: 'facebook' })
      .first();
    await expect(facebookConnectedPlatform.locator('.platform-status')).toContainText('Connected', {
      timeout: 10000,
    });

    console.log('[E2E] ✅ Facebook connected successfully');

    // =========================================================================
    // STEP 4: Create a new livestream
    // =========================================================================
    console.log('[E2E] Step 4: Creating livestream...');

    // Wait for streams section to be visible
    await page.waitForSelector('#streams-section', { state: 'visible' });

    // Fill in stream details
    const streamTitle = `E2E Test Stream ${Date.now()}`;
    const streamDescription = 'This is an automated E2E test stream for YouTube and Facebook';

    await page.fill('#stream-title', streamTitle);
    await page.fill('#stream-description', streamDescription);

    // Select both YouTube and Facebook platforms
    const youtubePlatformCheckbox = page.locator('input[name="platforms"][value="youtube"]');
    const facebookPlatformCheckbox = page.locator('input[name="platforms"][value="facebook"]');

    // Wait for checkboxes to appear (they appear after platforms are loaded)
    await expect(youtubePlatformCheckbox).toBeVisible({ timeout: 5000 });
    await expect(facebookPlatformCheckbox).toBeVisible({ timeout: 5000 });

    // Check both platforms
    await youtubePlatformCheckbox.check();
    await facebookPlatformCheckbox.check();

    // Verify checkboxes are checked
    await expect(youtubePlatformCheckbox).toBeChecked();
    await expect(facebookPlatformCheckbox).toBeChecked();

    // Click Create Stream button
    await page.click('button:has-text("Create Stream")');

    // Wait for success message
    await expect(page.locator('#stream-status')).toContainText(/created/i, { timeout: 10000 });
    await expect(page.locator('#stream-status')).toHaveClass(/success/);

    console.log('[E2E] ✅ Stream created successfully');

    // Wait for stream to appear in the list
    await page.waitForTimeout(2000);

    // Verify stream appears in the streams list
    const streamCard = page.locator('.stream-card').filter({ hasText: streamTitle }).first();
    await expect(streamCard).toBeVisible({ timeout: 5000 });

    // Extract stream ID from the stream card
    const streamIdMatch = (await streamCard.innerHTML()).match(/stream-([a-f0-9-]+)/);
    const streamId = streamIdMatch ? streamIdMatch[1] : null;
    expect(streamId).toBeTruthy();

    console.log(`[E2E] Stream ID: ${streamId}`);

    // Verify stream shows both platforms
    await expect(streamCard).toContainText('youtube');
    await expect(streamCard).toContainText('facebook');

    // =========================================================================
    // STEP 5: Start the livestream
    // =========================================================================
    console.log('[E2E] Step 5: Starting livestream...');

    // Find and click the Start Stream button
    const startStreamButton = streamCard.locator('button:has-text("Start Stream")');
    await expect(startStreamButton).toBeVisible();
    await startStreamButton.click();

    // Wait for stream to start (this might take a few seconds)
    await page.waitForTimeout(3000);

    // Reload to get updated stream status
    await page.reload();
    await page.waitForSelector('#streams-section', { state: 'visible' });

    // =========================================================================
    // STEP 6: Verify stream is active
    // =========================================================================
    console.log('[E2E] Step 6: Verifying stream is active...');

    // Find the stream card again
    const activeStreamCard = page.locator('.stream-card').filter({ hasText: streamTitle }).first();
    await expect(activeStreamCard).toBeVisible({ timeout: 5000 });

    // Verify stream status shows "Active" or "Live"
    await expect(activeStreamCard.locator('.stream-status')).toContainText(/active|live/i, {
      timeout: 10000,
    });

    // Verify Stop Stream button is now visible
    const stopStreamButton = activeStreamCard.locator('button:has-text("Stop Stream")');
    await expect(stopStreamButton).toBeVisible();

    console.log('[E2E] ✅ Stream is active and broadcasting!');

    // =========================================================================
    // CLEANUP: Stop the stream
    // =========================================================================
    console.log('[E2E] Cleanup: Stopping stream...');

    await stopStreamButton.click();
    await page.waitForTimeout(2000);

    console.log('[E2E] ✅ Stream stopped');

    // =========================================================================
    // FINAL VERIFICATION
    // =========================================================================
    console.log('\n[E2E] ✅ ✅ ✅ ALL STEPS COMPLETED SUCCESSFULLY! ✅ ✅ ✅');
    console.log('[E2E] Summary:');
    console.log(`[E2E]   - Community: ${communityName} (${communityId})`);
    console.log(`[E2E]   - YouTube: Connected ✅`);
    console.log(`[E2E]   - Facebook: Connected ✅`);
    console.log(`[E2E]   - Stream: ${streamTitle}`);
    console.log(`[E2E]   - Status: Started and stopped successfully ✅\n`);
  });
});
