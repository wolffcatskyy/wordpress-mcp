# Contributing to WordPress MCP

Welcome! We're thrilled you're interested in contributing. This guide is designed for **everyone** -- whether you're contributing your first line of code, using AI tools to help, or simply reporting ideas. No prior open source experience required.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [First-Time Contributors](#first-time-contributors)
- [Using AI to Contribute](#using-ai-to-contribute)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Pull Requests](#submitting-pull-requests)
- [Getting Help](#getting-help)

---

## Ways to Contribute

### Bug Reports & Issues
- WordPress API compatibility problems
- Authentication issues with Application Passwords
- Tool behavior not matching documentation

### Features
- Pages, media, users, comments, plugins management
- WooCommerce product support
- Custom post type support
- Bulk operations

### Documentation
- Setup guides for different WordPress hosts
- Examples of Claude workflows with WordPress
- Troubleshooting common issues

---

## First-Time Contributors

### Fork > Clone > Branch > PR

```bash
git clone https://github.com/YOUR-USERNAME/wordpress-mcp.git
cd wordpress-mcp
git checkout -b feature/my-feature
# Make changes
git add . && git commit -m "Feature: add pages support"
git push origin feature/my-feature
# Open PR on GitHub
```

---

## Using AI to Contribute

We **welcome and encourage** AI-assisted contributions.

### Architecture Context for AI

Paste this into your AI assistant:

```
I want to contribute to wordpress-mcp. Here's the project context:

- TypeScript MCP server using @modelcontextprotocol/sdk
- WordPress REST API client using axios with Basic Auth (Application Passwords)
- Entry point: src/index.ts -- MCP server setup, tool definitions, request handlers
- API client: src/wordpress.ts -- WordPressClient class with all REST API methods
- Logger: src/utils/logger.ts -- JSON structured logging to stderr
- All tools return { content: [{ type: "text", text: JSON.stringify(result) }] }
- Errors return { content: [{ type: "text", text: "Error: ..." }], isError: true }
- Docker: node:20-alpine multi-stage build, non-root user
- Config: env vars (WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_PASSWORD)

The issue I want to work on is: [paste issue here]
```

### Guidelines

1. **Review everything** before submitting
2. **Disclose AI usage** in your PR description
3. **Test thoroughly** -- run against a real WordPress instance
4. **No AI slop** -- we won't accept unreviewed output

---

## Development Setup

```bash
npm install
cp .env.example .env
# Edit .env with your WordPress credentials
npm run dev
```

## Code Style

- TypeScript strict mode
- ESM imports with .js extensions
- Structured JSON logging to stderr only
- Error handling: catch, log, return isError response

---

## Submitting Pull Requests

```markdown
## Description
Brief summary.

## How Was This Tested?
- WordPress version: [e.g., 6.4]
- Scenarios verified: [list]

## AI Assistance (if applicable)
**Tools Used:** Claude / ChatGPT / Copilot
**Scope:** Generated [specific part]
**Validation:** Tested in [environment]
```

---

## Getting Help

**"Can I use AI tools?"** -- Yes! Just review and test everything.

**"How long until my PR is reviewed?"** -- We aim for a few days.

---

**Ready to contribute? Pick an issue from the [issues page](../../issues) and get started!**
