# User Instructions for Claude Code Sessions

This file contains all instructions given by the user during the initial build session. Any Claude Code instance working on this project should read and follow these instructions.

## Primary Instructions

### Build Requirements
**User said**: "I need you to fully build this project from scratch. you are running inside github codespace. you have full authority to run, install, developer, test. I want you to have full control of the shell/terminal. commit anything you want. freely use git. create branches/PRs as needed. dont stop until you completed the mission. it should be fully tested with integration."

**Key Points**:
- Environment: GitHub Codespace
- Full authority granted for: install, develop, test, commit, push, branch, PR
- Must be fully tested with integration tests
- Don't stop until mission complete

### Documentation Requirements
**User said**: "write and updates files that include your learnings, plans and needs"

**Key Points**:
- Document learnings as you work
- Keep plans updated
- Track what's needed for completion

### Git Workflow Requirements
**User said**:
- "keep commiting whenever you hit a milestone"
- "git pushing and creating branches/PRs and merging so that we dont lose state"
- "commit everything and push"

**Key Points**:
- Commit at every milestone (not just at the end)
- Push commits to remote frequently
- Use branches and PRs to preserve state
- Never lose work - commit and push regularly

### Context Preservation
**User said**: "put the instructions I gave you now in a file that explains my instructions and so that you will keep refering back to this file"

**Key Points**:
- Create reference files with all instructions
- Keep referring back to these files
- Ensure continuity across Claude Code sessions

### Final Instruction
**User said**: "find all my instructions from this chat, put them and put your plan in files that claude code is likely to read"

**Key Points**:
- Consolidate all instructions
- Create files Claude Code automatically finds
- Include detailed plans

## Project Requirements (from .clinerules)

See `.clinerules` for complete architecture requirements. Key points:

### Architecture
- **Modular providers**: Each platform completely independent
- **Abstract interfaces**: All implement `StreamProvider`
- **Graceful degradation**: Continue working when platforms fail
- **Per-community OAuth**: Separate tokens per platform

### Platforms
- YouTube: Full support (OAuth, streams, chat)
- Facebook: Full support (OAuth, streams, comments)
- TikTok: Stub (requires API approval)
- Instagram: Stub (no official API)

### Code Standards
- TypeScript strict mode
- Error handling with try-catch
- Unit tests (Jest) + integration tests (Playwright)
- Async/await (no callbacks)
- ESM modules (import/export)

### Testing Requirements
- Minimum 80% code coverage
- Mock external API calls in unit tests
- Integration tests with Playwright
- All providers must have identical test structure

## Current Status

### ✅ Completed
- Full TypeScript/Node.js application
- YouTube & Facebook providers fully implemented
- TikTok & Instagram stubs
- RESTful API with Express
- WebSocket chat server
- Rate limiting & error handling
- API key authentication
- 28 unit tests passing
- Playwright integration tests configured
- Complete documentation
- Build passing with zero errors
- All code committed and pushed

### 🔲 Remaining Work
- Increase test coverage from 24% to 80%
- Run Playwright integration tests end-to-end
- Add more comprehensive API route tests
- Add middleware tests
- Add stream service tests
- Add WebSocket server tests
- Migrate from in-memory to PostgreSQL database
- Add Docker deployment
- Add CI/CD pipeline

## How to Continue This Project

1. **Read these files first**:
   - `CLAUDE_INSTRUCTIONS.md` (this file) - User instructions
   - `PROJECT_STATUS.md` - Current implementation status
   - `DEVELOPMENT_PLAN.md` - Next steps and roadmap
   - `.clinerules` - Architecture principles
   - `README.md` - API documentation

2. **Understand what's built**:
   - Review `BUILD_SUMMARY.md` for overview
   - Check `src/` directory structure
   - Read test files in `src/__tests__/`

3. **Follow the workflow**:
   - Commit at every milestone
   - Push to remote frequently
   - Create branches for major features
   - Document as you work

4. **Testing requirements**:
   - Maintain TypeScript strict mode
   - Write tests before or with code
   - Target 80% coverage
   - Run `npm test` frequently

5. **Git commands you have authority to run**:
   - `git add .`
   - `git commit -m "message"`
   - `git push origin main`
   - `git checkout -b feature-name`
   - `gh pr create` (GitHub CLI)

## Important Files to Reference

- `.clinerules` - Architecture and code standards
- `PROJECT_STATUS.md` - What's done, what's pending
- `DEVELOPMENT_PLAN.md` - Detailed roadmap
- `README.md` - API documentation and usage
- `BUILD_SUMMARY.md` - Complete build overview
- `PROJECT_INSTRUCTIONS.md` - Original requirements checklist

## User's Intent

The user wants omnistream to be middleware for **gigaverse.com** to:
- Stream RTMP to multiple social platforms simultaneously
- Handle OAuth for each platform per community
- Aggregate real-time chat from all platforms
- Schedule and manage live events
- Highlight messages across platforms

The goal is production-ready middleware, fully tested, well-documented, and ready to integrate with gigaverse.

---

**Remember**: You have full authority. Commit often. Push regularly. Test thoroughly. Don't stop until complete.
