/**
 * Omnistream WebSocket Client
 * Handles real-time chat message streaming via WebSocket
 */

class OmnistreamWebSocket {
  constructor(url = null) {
    this.url = url || `ws://${window.location.host}/ws/chat`;
    this.ws = null;
    this.streamId = null;
    this.apiKey = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // ms
    this.isIntentionallyClosed = false;

    // Event handlers
    this.onMessage = null;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;

        if (this.onConnect) {
          this.onConnect();
        }

        // Resubscribe to stream if we were subscribed before
        if (this.streamId && this.apiKey) {
          this.subscribe(this.streamId, this.apiKey);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onError) {
          this.onError(error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (this.onDisconnect) {
          this.onDisconnect();
        }

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.reconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    switch (data.type) {
      case 'subscribed':
        console.log('Subscribed to stream:', data.streamId);
        break;

      case 'message':
        console.log('Chat message received:', data.message);
        if (this.onMessage) {
          this.onMessage(data.message);
        }
        break;

      case 'messageHighlighted':
        console.log('Message highlighted:', data.messageId);
        // Could emit a separate event for this
        break;

      case 'highlighted':
        console.log('Highlight confirmed:', data.messageId);
        break;

      case 'error':
        console.error('WebSocket error message:', data.error);
        if (this.onError) {
          this.onError(new Error(data.error));
        }
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  /**
   * Subscribe to a stream's chat
   */
  subscribe(streamId, apiKey) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected. Call connect() first.');
      return false;
    }

    this.streamId = streamId;
    this.apiKey = apiKey;

    const message = {
      type: 'subscribe',
      streamId,
      apiKey,
    };

    this.ws.send(JSON.stringify(message));
    return true;
  }

  /**
   * Unsubscribe from current stream
   */
  unsubscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message = {
      type: 'unsubscribe',
    };

    this.ws.send(JSON.stringify(message));
    this.streamId = null;
    return true;
  }

  /**
   * Highlight a chat message
   */
  highlightMessage(messageId, platform) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    const message = {
      type: 'highlight',
      messageId,
      platform,
    };

    this.ws.send(JSON.stringify(message));
    return true;
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached. Giving up.');
      if (this.onError) {
        this.onError(new Error('Failed to reconnect to WebSocket'));
      }
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.isIntentionallyClosed = true;
    this.streamId = null;
    this.apiKey = null;

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.unsubscribe();
      }
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getState() {
    if (!this.ws) {
      return 'DISCONNECTED';
    }

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }
}

// Export for use in other modules
window.OmnistreamWebSocket = OmnistreamWebSocket;
