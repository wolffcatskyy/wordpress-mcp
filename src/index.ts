import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { WordPressClient } from "./wordpress.js";
import { logger } from "./utils/logger.js";

dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  "WORDPRESS_URL",
  "WORDPRESS_USERNAME",
  "WORDPRESS_PASSWORD",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize WordPress client
const wordpress = new WordPressClient(
  process.env.WORDPRESS_URL!,
  process.env.WORDPRESS_USERNAME!,
  process.env.WORDPRESS_PASSWORD!
);

// Tool definitions
const tools: Tool[] = [
  {
    name: "get_posts",
    description:
      "Retrieve WordPress posts with optional filtering and pagination",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Search posts by title or content",
        },
        per_page: {
          type: "number",
          description: "Number of posts per page (default: 10, max: 100)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        status: {
          type: "string",
          enum: ["publish", "draft", "pending", "private"],
          description: "Post status filter",
        },
        orderby: {
          type: "string",
          enum: ["date", "title", "id", "modified", "rand"],
          description: "Order posts by field",
        },
        order: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort order",
        },
      },
    },
  },
  {
    name: "get_post",
    description: "Retrieve a single post by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "WordPress post ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_post",
    description: "Create a new WordPress post",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Post title",
        },
        content: {
          type: "string",
          description: "Post content/body HTML",
        },
        excerpt: {
          type: "string",
          description: "Post excerpt",
        },
        status: {
          type: "string",
          enum: ["publish", "draft", "pending"],
          description: "Post status (default: draft)",
        },
        featured_media: {
          type: "number",
          description: "Featured image attachment ID",
        },
        categories: {
          type: "array",
          items: { type: "number" },
          description: "Array of category IDs",
        },
        tags: {
          type: "array",
          items: { type: "number" },
          description: "Array of tag IDs",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_post",
    description: "Update an existing WordPress post",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Post ID",
        },
        title: {
          type: "string",
          description: "Post title",
        },
        content: {
          type: "string",
          description: "Post content/body HTML",
        },
        excerpt: {
          type: "string",
          description: "Post excerpt",
        },
        status: {
          type: "string",
          enum: ["publish", "draft", "pending"],
          description: "Post status",
        },
        featured_media: {
          type: "number",
          description: "Featured image attachment ID",
        },
        categories: {
          type: "array",
          items: { type: "number" },
          description: "Array of category IDs",
        },
        tags: {
          type: "array",
          items: { type: "number" },
          description: "Array of tag IDs",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_post",
    description: "Delete a WordPress post (moves to trash)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Post ID to delete",
        },
        force: {
          type: "boolean",
          description: "Permanently delete instead of trash",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_categories",
    description: "Retrieve WordPress categories",
    inputSchema: {
      type: "object",
      properties: {
        per_page: {
          type: "number",
          description: "Categories per page (default: 10)",
        },
        search: {
          type: "string",
          description: "Search categories by name",
        },
      },
    },
  },
  {
    name: "get_tags",
    description: "Retrieve WordPress tags",
    inputSchema: {
      type: "object",
      properties: {
        per_page: {
          type: "number",
          description: "Tags per page (default: 10)",
        },
        search: {
          type: "string",
          description: "Search tags by name",
        },
      },
    },
  },
  {
    name: "publish_post",
    description: "Publish a draft or pending post immediately",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Post ID to publish",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_site_info",
    description: "Get WordPress site information and capabilities",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "search_site",
    description:
      "Search across all WordPress content types (posts, pages, categories, tags, media) in a single query. Returns matching results with their type, title, and URL.",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Search term to find across all content",
        },
        per_page: {
          type: "number",
          description: "Number of results per page (default: 10, max: 100)",
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
        type: {
          type: "string",
          enum: ["post", "term", "post-format"],
          description:
            "Limit search to a specific content type (default: all types)",
        },
        subtype: {
          type: "string",
          enum: ["post", "page", "category", "tag", "any"],
          description: "Limit search to a specific subtype (default: any)",
        },
      },
      required: ["search"],
    },
  },
  // ===== Media Tools =====
  {
    name: "upload_media",
    description:
      "Upload a media file (image, video, PDF, etc.) to WordPress. Provide file data as base64-encoded string. Returns the attachment ID which can be used as featured_media on posts.",
    inputSchema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description:
            "Filename with extension (e.g., 'photo.jpg', 'document.pdf')",
        },
        data: {
          type: "string",
          description: "Base64-encoded file content",
        },
        title: {
          type: "string",
          description: "Media title",
        },
        alt_text: {
          type: "string",
          description: "Alt text for images (accessibility)",
        },
        caption: {
          type: "string",
          description: "Media caption",
        },
        description: {
          type: "string",
          description: "Media description",
        },
      },
      required: ["filename", "data"],
    },
  },
  {
    name: "get_media",
    description:
      "Get details of a single media attachment by ID (URL, dimensions, alt text, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Media attachment ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_media",
    description:
      "List media attachments in the WordPress media library with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        per_page: {
          type: "number",
          description:
            "Number of items per page (default: 10, max: 100)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        search: {
          type: "string",
          description: "Search media by title",
        },
        media_type: {
          type: "string",
          enum: ["image", "video", "audio", "application"],
          description: "Filter by media type",
        },
        mime_type: {
          type: "string",
          description: "Filter by MIME type (e.g., 'image/jpeg')",
        },
        orderby: {
          type: "string",
          enum: ["date", "title", "id"],
          description: "Order by field",
        },
        order: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort order",
        },
      },
    },
  },
  {
    name: "delete_media",
    description: "Permanently delete a media attachment from WordPress",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Media attachment ID to delete",
        },
        force: {
          type: "boolean",
          description:
            "Must be true for media (media doesn't support trash). Defaults to true.",
        },
      },
      required: ["id"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "wordpress-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info("Listing available tools");
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info(`Calling tool: ${name}`, { arguments: args });

  try {
    switch (name) {
      case "get_posts":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(await wordpress.getPosts(args), null, 2),
            },
          ],
        };

      case "get_post":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.getPost((args as any).id),
                null,
                2
              ),
            },
          ],
        };

      case "create_post":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.createPost(args as any),
                null,
                2
              ),
            },
          ],
        };

      case "update_post":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.updatePost((args as any).id, args as any),
                null,
                2
              ),
            },
          ],
        };

      case "delete_post":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.deletePost((args as any).id, (args as any).force),
                null,
                2
              ),
            },
          ],
        };

      case "get_categories":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.getCategories(args as any),
                null,
                2
              ),
            },
          ],
        };

      case "get_tags":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(await wordpress.getTags(args as any), null, 2),
            },
          ],
        };

      case "publish_post":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.publishPost((args as any).id),
                null,
                2
              ),
            },
          ],
        };

      case "get_site_info":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(await wordpress.getSiteInfo(), null, 2),
            },
          ],
        };

      case "search_site":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.searchSite(args as any),
                null,
                2
              ),
            },
          ],
        };

      // ===== Media Handlers =====
      case "upload_media":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.uploadMedia(args as any),
                null,
                2
              ),
            },
          ],
        };

      case "get_media":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.getMedia((args as any).id),
                null,
                2
              ),
            },
          ],
        };

      case "list_media":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.listMedia(args as any),
                null,
                2
              ),
            },
          ],
        };

      case "delete_media":
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                await wordpress.deleteMedia(
                  (args as any).id,
                  (args as any).force
                ),
                null,
                2
              ),
            },
          ],
        };

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    logger.error(`Tool execution failed: ${name}`, { error });
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("WordPress MCP server started");
}

main().catch((error) => {
  logger.error("Server startup failed", { error });
  process.exit(1);
});
