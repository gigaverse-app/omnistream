/**
 * Omnistream API Client
 * Handles all API communication with the Omnistream backend
 */

class OmnistreamAPI {
  constructor(baseURL = '') {
    this.baseURL = baseURL || window.location.origin;
    this.apiVersion = 'v1';
    this.apiKey = null;
  }

  /**
   * Set API key for authenticated requests
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('omnistream_api_key', apiKey);
  }

  /**
   * Get API key from memory or localStorage
   */
  getApiKey() {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('omnistream_api_key');
    }
    return this.apiKey;
  }

  /**
   * Clear API key
   */
  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('omnistream_api_key');
  }

  /**
   * Make HTTP request to API
   */
  async request(method, endpoint, data = null, requiresAuth = false) {
    const url = `${this.baseURL}/api/${this.apiVersion}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        throw new Error('API key required but not set');
      }
      headers['X-API-Key'] = apiKey;
    }

    const options = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // Communities
  // ============================================================================

  /**
   * Create a new community
   */
  async createCommunity(name) {
    const result = await this.request('POST', '/communities', { name });
    if (result.success && result.data.apiKey) {
      this.setApiKey(result.data.apiKey);
    }
    return result.data;
  }

  /**
   * List all communities
   */
  async listCommunities() {
    const result = await this.request('GET', '/communities');
    return result.data;
  }

  // ============================================================================
  // OAuth / Authentication
  // ============================================================================

  /**
   * Get OAuth authorization URL for a platform
   */
  async getAuthUrl(platform, communityId) {
    const result = await this.request('GET', `/auth/${platform}/authorize?communityId=${communityId}`);
    return result.data;
  }

  /**
   * Revoke OAuth authorization for a platform
   */
  async revokeAuth(platform, communityId) {
    const result = await this.request('DELETE', `/auth/${platform}?communityId=${communityId}`);
    return result.data;
  }

  /**
   * Check if a platform is authorized (by trying to create/list streams)
   * Note: There's no direct endpoint for this, so we'll track it client-side
   */
  async checkAuthStatus(platform, communityId) {
    // This is a helper method - the actual auth status is determined
    // when creating streams (if OAuth tokens exist, stream creation succeeds)
    // For now, we'll store auth status in localStorage after successful OAuth
    const authStatus = JSON.parse(localStorage.getItem('omnistream_auth_status') || '{}');
    return authStatus[platform] || false;
  }

  /**
   * Mark platform as authorized (called after OAuth callback)
   */
  setAuthStatus(platform, isAuthorized) {
    const authStatus = JSON.parse(localStorage.getItem('omnistream_auth_status') || '{}');
    authStatus[platform] = isAuthorized;
    localStorage.setItem('omnistream_auth_status', JSON.stringify(authStatus));
  }

  // ============================================================================
  // Streams
  // ============================================================================

  /**
   * Create a new stream
   */
  async createStream(streamData) {
    const result = await this.request('POST', '/streams', streamData, true);
    return result.data;
  }

  /**
   * List all streams for authenticated community
   */
  async listStreams() {
    const result = await this.request('GET', '/streams', null, true);
    return result.data;
  }

  /**
   * Get stream status
   */
  async getStreamStatus(streamId) {
    const result = await this.request('GET', `/streams/${streamId}`, null, true);
    return result.data;
  }

  /**
   * Start a stream
   */
  async startStream(streamId) {
    const result = await this.request('POST', `/streams/${streamId}/start`, null, true);
    return result.data;
  }

  /**
   * Stop a stream
   */
  async stopStream(streamId) {
    const result = await this.request('POST', `/streams/${streamId}/stop`, null, true);
    return result.data;
  }

  /**
   * Delete a stream
   */
  async deleteStream(streamId) {
    const result = await this.request('DELETE', `/streams/${streamId}`, null, true);
    return result.data;
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Check API health
   */
  async checkHealth() {
    const response = await fetch(`${this.baseURL}/health`);
    return await response.json();
  }
}

// Export for use in other modules
window.OmnistreamAPI = OmnistreamAPI;
