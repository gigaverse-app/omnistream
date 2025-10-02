# Project Build Instructions

## User Requirements
- Fully build the omnistream project from scratch
- Running in GitHub Codespace environment
- Full authority to run, install, develop, and test
- Full control of shell/terminal
- Commit milestones as they are reached
- Create branches/PRs and merge to prevent state loss
- Don't stop until mission is completed
- Must be fully tested with integration tests

## Implementation Checklist
- [x] Set up project structure and TypeScript configuration
- [x] Install all required dependencies
- [x] Create core interfaces and types
- [ ] Implement YouTube provider with OAuth
- [ ] Implement Facebook provider with OAuth
- [ ] Implement TikTok provider stub
- [ ] Implement Instagram provider stub
- [ ] Create RESTful API routes
- [ ] Implement WebSocket chat functionality
- [ ] Set up database for OAuth tokens
- [ ] Write unit tests for all providers
- [ ] Write integration tests with Playwright
- [ ] Add rate limiting and error handling middleware
- [ ] Update README with API documentation
- [ ] Run full test suite and verify 80% coverage
- [ ] Create production build and verify
- [ ] Commit and create PR

## Development Principles
- Commit whenever hitting a milestone
- Use git pushing, branching, and PRs to preserve state
- Keep updating this file with learnings, plans, and needs
- Follow all .clinerules architecture principles
- Maintain TypeScript strict mode
- Ensure graceful degradation for unsupported platform features
- Test everything with unit and integration tests

## Current Status
Working on provider implementations (YouTube, Facebook completed).
Next: TikTok and Instagram stubs, then API routes and WebSocket.
