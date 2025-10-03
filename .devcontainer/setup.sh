#!/bin/bash

# Update npm to latest version
npm install -g npm@latest

# Install project dependencies
npm install

# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Install Playwright browsers
npx playwright install chromium

# Install Playwright system dependencies (requires sudo)
sudo npx playwright install-deps

# Add alias to bashrc
echo 'alias claude-code="npx @anthropic-ai/claude-code"' >> ~/.bashrc

echo "✅ Codespace setup complete!"
