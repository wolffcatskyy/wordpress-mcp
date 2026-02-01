# WordPress MCP Server

A Model Context Protocol (MCP) server that lets Claude manage WordPress sites through the WordPress REST API.

## Features

- **Posts**: Create, read, update, delete, publish, search
- **Categories & Tags**: List and filter taxonomies
- **Site Info**: Query site configuration and capabilities
- **Application Passwords**: Secure auth without hardcoded credentials
- **Docker Ready**: Multi-stage build, non-root, production-hardened

## Quick Start

```bash
git clone https://github.com/wolffcatskyy/wordpress-mcp.git
cd wordpress-mcp
npm install
cp .env.example .env
# Edit .env with your WordPress URL and Application Password
npm run build
npm start
```

## Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/path/to/wordpress-mcp/dist/index.js"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "admin",
        "WORDPRESS_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `WORDPRESS_URL` | Yes | WordPress site URL (e.g., `https://your-site.com`) |
| `WORDPRESS_USERNAME` | Yes | WordPress admin username |
| `WORDPRESS_PASSWORD` | Yes | Application Password (generate in WP Admin > Users > Profile) |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, `error` (default: `info`) |

## Authentication Setup

This server uses [WordPress Application Passwords](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/) (built into WordPress 5.6+):

1. Go to **WordPress Admin > Users > Your Profile**
2. Scroll to **Application Passwords**
3. Enter name: `Claude MCP`
4. Click **Add New Application Password**
5. Copy the generated password (spaces are fine)
6. Use it as `WORDPRESS_PASSWORD` in your config

## Available Tools

| Tool | Description |
|------|-------------|
| `get_posts` | List posts with filtering (search, status, pagination, ordering) |
| `get_post` | Get a single post by ID |
| `create_post` | Create a new post (title, content, excerpt, status, categories, tags) |
| `update_post` | Update an existing post |
| `delete_post` | Delete/trash a post |
| `publish_post` | Publish a draft or pending post |
| `get_categories` | List categories with optional search |
| `get_tags` | List tags with optional search |
| `get_site_info` | Get site name, description, URL, timezone, capabilities |

## Docker

```bash
# Build and run
docker compose up -d

# View logs
docker logs wordpress-mcp
```

## Development

```bash
npm run dev    # Run with tsx (hot reload)
npm run build  # Compile TypeScript
npm start      # Run compiled JS
```

## Project Structure

```
src/
|-- index.ts          # MCP server entry point, tool definitions, request handlers
|-- wordpress.ts      # WordPress REST API client (posts, categories, tags, site)
|-- utils/
    |-- logger.ts     # Structured JSON logging to stderr
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help -- including using AI tools to tackle open issues.

## License

MIT -- see [LICENSE](LICENSE)
