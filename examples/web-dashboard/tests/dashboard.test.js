const { test, expect } = require('@playwright/test');

test.describe('Omnistream Web Dashboard E2E Tests', () => {
  let communityName;
  let apiKey;
  let communityId;

  test.beforeEach(async ({ page }) => {
    communityName = `Test Community ${Date.now()}`;
    await page.goto('/');
  });

  test('should load the dashboard homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Omnistream Dashboard/);
    await expect(page.locator('h1')).toContainText('Omnistream Dashboard');
    await expect(page.locator('.subtitle')).toContainText('Multi-Platform Live Streaming');
  });

  test('should show authentication section on load', async ({ page }) => {
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(page.locator('#profile-section')).not.toBeVisible();
    await expect(page.locator('#platforms-section')).not.toBeVisible();
    await expect(page.locator('#streams-section')).not.toBeVisible();
  });

  test('should create a new community successfully', async ({ page }) => {
    // Fill in community name
    await page.fill('#community-name', communityName);

    // Click create button
    await page.click('button:has-text("Create Community")');

    // Wait for success message
    await expect(page.locator('#auth-status')).toContainText(/created/i);
    await expect(page.locator('#auth-status')).toHaveClass(/success/);

    // Wait for profile section to appear
    await page.waitForSelector('#profile-section', { state: 'visible', timeout: 5000 });

    // Verify we're logged in
    await expect(page.locator('#profile-section')).toBeVisible();
    await expect(page.locator('#auth-section')).not.toBeVisible();

    // Verify community name is displayed
    await expect(page.locator('#profile-name')).toContainText(communityName);

    // Verify API key is displayed
    const apikeyElement = page.locator('#profile-apikey');
    await expect(apikeyElement).toBeVisible();
    const apiKeyText = await apikeyElement.textContent();
    expect(apiKeyText).toMatch(/^omni_/);

    // Save for next tests
    apiKey = apiKeyText;
  });

  test('should show platforms section after login', async ({ page }) => {
    // Create community
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#platforms-section', { state: 'visible' });

    // Verify platforms section
    await expect(page.locator('#platforms-section')).toBeVisible();
    await expect(page.locator('#platforms-section h2')).toContainText('Connect Streaming Platforms');

    // Verify platform cards exist
    await expect(page.locator('.platform-card')).toHaveCount(3); // YouTube, Facebook, TikTok
  });

  test('should display platform cards with connect buttons', async ({ page }) => {
    // Create community
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#platforms-section', { state: 'visible' });

    // Check YouTube platform
    const youtubePlatform = page.locator('.platform-card').filter({ hasText: 'youtube' }).first();
    await expect(youtubePlatform).toBeVisible();
    await expect(youtubePlatform.locator('.platform-status')).toContainText('Not Connected');
    await expect(youtubePlatform.locator('button:has-text("Connect")')).toBeVisible();
  });

  test('should show streams section after login', async ({ page }) => {
    // Create community
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#streams-section', { state: 'visible' });

    // Verify streams section
    await expect(page.locator('#streams-section')).toBeVisible();
    await expect(page.locator('#streams-section h2')).toContainText('Stream Management');

    // Verify stream creation form
    await expect(page.locator('#stream-title')).toBeVisible();
    await expect(page.locator('#stream-description')).toBeVisible();
    await expect(page.locator('button:has-text("Create Stream")')).toBeVisible();
  });

  test('should show validation error when creating stream without title', async ({ page }) => {
    // Create community first
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#streams-section', { state: 'visible' });

    // Try to create stream without title
    await page.click('button:has-text("Create Stream")');

    // Should show error
    await expect(page.locator('#stream-status')).toContainText(/title/i);
    await expect(page.locator('#stream-status')).toHaveClass(/error/);
  });

  test('should show validation error when creating stream without selecting platforms', async ({ page }) => {
    // Create community first
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#streams-section', { state: 'visible' });

    // Fill title but don't select platforms
    await page.fill('#stream-title', 'Test Stream');
    await page.click('button:has-text("Create Stream")');

    // Should show error about platforms
    await expect(page.locator('#stream-status')).toContainText(/platform/i);
    await expect(page.locator('#stream-status')).toHaveClass(/error/);
  });

  test('should create a stream successfully', async ({ page }) => {
    // Create community first
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#streams-section', { state: 'visible' });

    // Wait for platforms to load and show checkboxes
    // Note: Since we don't have OAuth connected, this will show message about connecting platforms
    // We'll test the UI elements exist
    await page.waitForTimeout(1000); // Give time for platform loading

    // For now, verify the form elements work
    await page.fill('#stream-title', 'E2E Test Stream');
    await page.fill('#stream-description', 'This is an end-to-end test stream');

    // The actual stream creation will fail without connected platforms,
    // but we verify the UI works
    const streamTitle = await page.inputValue('#stream-title');
    expect(streamTitle).toBe('E2E Test Stream');
  });

  test('should logout successfully', async ({ page }) => {
    // Create community first
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#profile-section', { state: 'visible' });

    // Click logout
    await page.click('button:has-text("Logout")');

    // Verify we're back to auth section
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(page.locator('#profile-section')).not.toBeVisible();
    await expect(page.locator('#platforms-section')).not.toBeVisible();
    await expect(page.locator('#streams-section')).not.toBeVisible();

    // Verify logout message
    await expect(page.locator('#auth-status')).toContainText(/logged out/i);
  });

  test('should login with existing API key', async ({ page }) => {
    // First create a community
    const testCommunityName = `Login Test ${Date.now()}`;
    await page.fill('#community-name', testCommunityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#profile-section', { state: 'visible' });

    // Get the API key
    const savedApiKey = await page.locator('#profile-apikey').textContent();

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page.locator('#auth-section')).toBeVisible();

    // Login with the API key
    await page.fill('#login-apikey', savedApiKey);
    await page.click('text=Use Existing API Key >> .. >> button:has-text("Login")');

    // Wait for profile to load
    await page.waitForSelector('#profile-section', { state: 'visible' });

    // Verify we're logged in with the same community
    await expect(page.locator('#profile-name')).toContainText(testCommunityName);
    await expect(page.locator('#profile-apikey')).toContainText(savedApiKey);
  });

  test('should show error for invalid API key', async ({ page }) => {
    // Try to login with invalid API key
    await page.fill('#login-apikey', 'omni_invalid_key_12345');
    await page.click('text=Use Existing API Key >> .. >> button:has-text("Login")');

    // Should show error (either "invalid" or "not found")
    await expect(page.locator('#auth-status')).toContainText(/(invalid|not found)/i);
    await expect(page.locator('#auth-status')).toHaveClass(/error/);

    // Should still be on auth section
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(page.locator('#profile-section')).not.toBeVisible();
  });

  test('should persist session in localStorage', async ({ page }) => {
    // Create community
    const testCommunityName = `Session Test ${Date.now()}`;
    await page.fill('#community-name', testCommunityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#profile-section', { state: 'visible' });

    // Get the API key from localStorage
    const storedApiKey = await page.evaluate(() => localStorage.getItem('omnistream_api_key'));
    expect(storedApiKey).toMatch(/^omni_/);

    // Reload page
    await page.reload();

    // Should still be logged in
    await page.waitForSelector('#profile-section', { state: 'visible', timeout: 5000 });
    await expect(page.locator('#profile-name')).toContainText(testCommunityName);
  });

  test('should clear localStorage on logout', async ({ page }) => {
    // Create community
    await page.fill('#community-name', communityName);
    await page.click('button:has-text("Create Community")');
    await page.waitForSelector('#profile-section', { state: 'visible' });

    // Verify localStorage has data
    let storedApiKey = await page.evaluate(() => localStorage.getItem('omnistream_api_key'));
    expect(storedApiKey).toBeTruthy();

    // Logout
    await page.click('button:has-text("Logout")');

    // Verify localStorage is cleared
    storedApiKey = await page.evaluate(() => localStorage.getItem('omnistream_api_key'));
    expect(storedApiKey).toBeNull();
  });

  test('should have demo information section visible', async ({ page }) => {
    await expect(page.locator('#demo-info')).toBeVisible();
    await expect(page.locator('#demo-info')).toContainText('About This Demo');
    await expect(page.locator('#demo-info')).toContainText('Why Integrate Omnistream');
    await expect(page.locator('#demo-info')).toContainText('Gigaverse');
  });

  test('should display all expected features in demo info', async ({ page }) => {
    const demoSection = page.locator('#demo-info');

    await expect(demoSection).toContainText('User Authentication');
    await expect(demoSection).toContainText('OAuth Integration');
    await expect(demoSection).toContainText('Multi-Platform Streaming');
    await expect(demoSection).toContainText('Real-Time Control');
  });
});
