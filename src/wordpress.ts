import axios, { AxiosInstance } from "axios";
import { logger } from "./utils/logger.js";

interface PostParams {
  search?: string;
  per_page?: number;
  page?: number;
  status?: string;
  orderby?: string;
  order?: string;
}

interface CreatePostParams {
  title: string;
  content?: string;
  excerpt?: string;
  status?: string;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
}

interface SearchParams {
  search: string;
  per_page?: number;
  page?: number;
  type?: string;
  subtype?: string;
}

interface UploadMediaParams {
  filename: string;
  data: string; // base64-encoded file content
  title?: string;
  alt_text?: string;
  caption?: string;
  description?: string;
}

interface MediaListParams {
  per_page?: number;
  page?: number;
  search?: string;
  media_type?: string;
  mime_type?: string;
  orderby?: string;
  order?: string;
}

interface PageParams {
  search?: string;
  per_page?: number;
  page?: number;
  status?: string;
  orderby?: string;
  order?: string;
  parent?: number;
}

interface CreatePageParams {
  title: string;
  content?: string;
  excerpt?: string;
  status?: string;
  featured_media?: number;
  parent?: number;
}

export class WordPressClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(siteUrl: string, username: string, password: string) {
    this.baseURL = `${siteUrl}/wp-json/wp/v2`;

    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    logger.info("WordPress client initialized", {
      baseURL: this.baseURL,
      username,
    });
  }

  async getPosts(params: PostParams = {}) {
    try {
      const queryParams = {
        per_page: Math.min(params.per_page || 10, 100),
        page: params.page || 1,
        status: params.status || "publish",
        orderby: params.orderby || "date",
        order: params.order || "desc",
        ...(params.search && { search: params.search }),
      };

      logger.info("Fetching posts", { queryParams });

      const response = await this.client.get("/posts", { params: queryParams });

      return {
        posts: response.data,
        total: response.headers["x-wp-total"],
        totalPages: response.headers["x-wp-totalpages"],
        currentPage: queryParams.page,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch posts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getPost(id: number) {
    try {
      logger.info("Fetching post", { id });
      const response = await this.client.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch post ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createPost(params: CreatePostParams) {
    try {
      if (!params.title) {
        throw new Error("Post title is required");
      }

      logger.info("Creating post", { title: params.title });

      const payload = {
        title: params.title,
        content: params.content || "",
        excerpt: params.excerpt || "",
        status: params.status || "draft",
        ...(params.featured_media && { featured_media: params.featured_media }),
        ...(params.categories && { categories: params.categories }),
        ...(params.tags && { tags: params.tags }),
      };

      const response = await this.client.post("/posts", payload);

      logger.info("Post created successfully", { postId: response.data.id });

      return {
        id: response.data.id,
        title: response.data.title.rendered,
        link: response.data.link,
        status: response.data.status,
        content: response.data.content.rendered,
      };
    } catch (error) {
      throw new Error(
        `Failed to create post: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async updatePost(id: number, params: Partial<CreatePostParams>) {
    try {
      logger.info("Updating post", { id });

      const payload: Record<string, unknown> = {};
      if (params.title) payload.title = params.title;
      if (params.content) payload.content = params.content;
      if (params.excerpt) payload.excerpt = params.excerpt;
      if (params.status) payload.status = params.status;
      if (params.featured_media) payload.featured_media = params.featured_media;
      if (params.categories) payload.categories = params.categories;
      if (params.tags) payload.tags = params.tags;

      const response = await this.client.post(`/posts/${id}`, payload);

      logger.info("Post updated successfully", { postId: id });

      return {
        id: response.data.id,
        title: response.data.title.rendered,
        link: response.data.link,
        status: response.data.status,
      };
    } catch (error) {
      throw new Error(
        `Failed to update post ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async deletePost(id: number, force: boolean = false) {
    try {
      logger.info("Deleting post", { id, force });

      const response = await this.client.delete(`/posts/${id}`, {
        params: { force },
      });

      logger.info("Post deleted successfully", { postId: id });

      return {
        message: force ? "Post permanently deleted" : "Post moved to trash",
        id: response.data.id,
      };
    } catch (error) {
      throw new Error(
        `Failed to delete post ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getCategories(params: { per_page?: number; search?: string } = {}) {
    try {
      logger.info("Fetching categories", { params });

      const queryParams = {
        per_page: Math.min(params.per_page || 10, 100),
        ...(params.search && { search: params.search }),
      };

      const response = await this.client.get("/categories", {
        params: queryParams,
      });

      return {
        categories: response.data,
        total: response.headers["x-wp-total"],
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch categories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getTags(params: { per_page?: number; search?: string } = {}) {
    try {
      logger.info("Fetching tags", { params });

      const queryParams = {
        per_page: Math.min(params.per_page || 10, 100),
        ...(params.search && { search: params.search }),
      };

      const response = await this.client.get("/tags", { params: queryParams });

      return {
        tags: response.data,
        total: response.headers["x-wp-total"],
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch tags: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async publishPost(id: number) {
    try {
      logger.info("Publishing post", { id });

      const response = await this.client.post(`/posts/${id}`, {
        status: "publish",
      });

      logger.info("Post published successfully", { postId: id });

      return {
        id: response.data.id,
        title: response.data.title.rendered,
        link: response.data.link,
        status: response.data.status,
      };
    } catch (error) {
      throw new Error(
        `Failed to publish post ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ===== Page Management =====

  async getPages(params: PageParams = {}) {
    try {
      const queryParams = {
        per_page: Math.min(params.per_page || 10, 100),
        page: params.page || 1,
        status: params.status || "publish",
        orderby: params.orderby || "date",
        order: params.order || "desc",
        ...(params.search && { search: params.search }),
        ...(params.parent !== undefined && { parent: params.parent }),
      };

      logger.info("Fetching pages", { queryParams });

      const response = await this.client.get("/pages", { params: queryParams });

      return {
        pages: response.data,
        total: response.headers["x-wp-total"],
        totalPages: response.headers["x-wp-totalpages"],
        currentPage: queryParams.page,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch pages: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getPage(id: number) {
    try {
      logger.info("Fetching page", { id });
      const response = await this.client.get(`/pages/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch page ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createPage(params: CreatePageParams) {
    try {
      if (!params.title) {
        throw new Error("Page title is required");
      }

      logger.info("Creating page", { title: params.title });

      const payload = {
        title: params.title,
        content: params.content || "",
        excerpt: params.excerpt || "",
        status: params.status || "draft",
        ...(params.featured_media && { featured_media: params.featured_media }),
        ...(params.parent !== undefined && { parent: params.parent }),
      };

      const response = await this.client.post("/pages", payload);

      logger.info("Page created successfully", { pageId: response.data.id });

      return {
        id: response.data.id,
        title: response.data.title.rendered,
        link: response.data.link,
        status: response.data.status,
        parent: response.data.parent,
      };
    } catch (error) {
      throw new Error(
        `Failed to create page: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async updatePage(id: number, params: Partial<CreatePageParams>) {
    try {
      logger.info("Updating page", { id });

      const payload: Record<string, unknown> = {};
      if (params.title) payload.title = params.title;
      if (params.content) payload.content = params.content;
      if (params.excerpt) payload.excerpt = params.excerpt;
      if (params.status) payload.status = params.status;
      if (params.featured_media) payload.featured_media = params.featured_media;
      if (params.parent !== undefined) payload.parent = params.parent;

      const response = await this.client.post(`/pages/${id}`, payload);

      logger.info("Page updated successfully", { pageId: id });

      return {
        id: response.data.id,
        title: response.data.title.rendered,
        link: response.data.link,
        status: response.data.status,
        parent: response.data.parent,
      };
    } catch (error) {
      throw new Error(
        `Failed to update page ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async deletePage(id: number, force: boolean = false) {
    try {
      logger.info("Deleting page", { id, force });

      const response = await this.client.delete(`/pages/${id}`, {
        params: { force },
      });

      logger.info("Page deleted successfully", { pageId: id });

      return {
        message: force ? "Page permanently deleted" : "Page moved to trash",
        id: response.data.id,
      };
    } catch (error) {
      throw new Error(
        `Failed to delete page ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async publishPage(id: number) {
    try {
      logger.info("Publishing page", { id });

      const response = await this.client.post(`/pages/${id}`, {
        status: "publish",
      });

      logger.info("Page published successfully", { pageId: id });

      return {
        id: response.data.id,
        title: response.data.title.rendered,
        link: response.data.link,
        status: response.data.status,
      };
    } catch (error) {
      throw new Error(
        `Failed to publish page ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ===== Media Management =====

  private getMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      wav: "audio/wav",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }

  async uploadMedia(params: UploadMediaParams) {
    try {
      if (!params.filename) {
        throw new Error("Filename is required");
      }
      if (!params.data) {
        throw new Error("File data (base64) is required");
      }

      logger.info("Uploading media", { filename: params.filename });

      const fileBuffer = Buffer.from(params.data, "base64");

      // WordPress media upload requires sending raw binary data with Content-Disposition header
      const response = await this.client.post("/media", fileBuffer, {
        headers: {
          "Content-Type": this.getMimeType(params.filename),
          "Content-Disposition": `attachment; filename="${params.filename}"`,
        },
      });

      // Update title, alt_text, caption, description if provided
      const metaUpdates: Record<string, unknown> = {};
      if (params.title) metaUpdates.title = params.title;
      if (params.alt_text) metaUpdates.alt_text = params.alt_text;
      if (params.caption) metaUpdates.caption = params.caption;
      if (params.description) metaUpdates.description = params.description;

      if (Object.keys(metaUpdates).length > 0) {
        await this.client.post(`/media/${response.data.id}`, metaUpdates);
      }

      logger.info("Media uploaded successfully", { mediaId: response.data.id });

      return {
        id: response.data.id,
        title: response.data.title.rendered,
        source_url: response.data.source_url,
        media_type: response.data.media_type,
        mime_type: response.data.mime_type,
        link: response.data.link,
      };
    } catch (error) {
      throw new Error(
        `Failed to upload media: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getMedia(id: number) {
    try {
      logger.info("Fetching media", { id });

      const response = await this.client.get(`/media/${id}`);

      return {
        id: response.data.id,
        title: response.data.title.rendered,
        source_url: response.data.source_url,
        media_type: response.data.media_type,
        mime_type: response.data.mime_type,
        alt_text: response.data.alt_text,
        caption: response.data.caption?.rendered,
        description: response.data.description?.rendered,
        media_details: response.data.media_details,
        link: response.data.link,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch media ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async listMedia(params: MediaListParams = {}) {
    try {
      const queryParams = {
        per_page: Math.min(params.per_page || 10, 100),
        page: params.page || 1,
        orderby: params.orderby || "date",
        order: params.order || "desc",
        ...(params.search && { search: params.search }),
        ...(params.media_type && { media_type: params.media_type }),
        ...(params.mime_type && { mime_type: params.mime_type }),
      };

      logger.info("Listing media", { queryParams });

      const response = await this.client.get("/media", { params: queryParams });

      return {
        media: response.data.map((item: any) => ({
          id: item.id,
          title: item.title.rendered,
          source_url: item.source_url,
          media_type: item.media_type,
          mime_type: item.mime_type,
          date: item.date,
        })),
        total: response.headers["x-wp-total"],
        totalPages: response.headers["x-wp-totalpages"],
        currentPage: queryParams.page,
      };
    } catch (error) {
      throw new Error(
        `Failed to list media: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async deleteMedia(id: number, force: boolean = true) {
    try {
      logger.info("Deleting media", { id, force });

      // Note: WordPress requires force=true for media deletion (media doesn't support trash)
      const response = await this.client.delete(`/media/${id}`, {
        params: { force },
      });

      logger.info("Media deleted successfully", { mediaId: id });

      return {
        message: "Media permanently deleted",
        id: response.data.id,
      };
    } catch (error) {
      throw new Error(
        `Failed to delete media ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getSiteInfo() {
    try {
      logger.info("Fetching site info");

      const response = await this.client.get("/");

      return {
        name: response.data.name,
        description: response.data.description,
        url: response.data.url,
        timezone: response.data.timezone,
        authentication: "Basic Auth (Application Password)",
        capabilities: {
          canCreatePosts: true,
          canUpdatePosts: true,
          canDeletePosts: true,
          canCreatePages: true,
          canUpdatePages: true,
          canDeletePages: true,
          canManageCategories: true,
          canManageTags: true,
          canUploadMedia: true,
          canDeleteMedia: true,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch site info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  async searchSite(params: SearchParams) {
    try {
      if (!params.search) throw new Error("Search term is required");

      const queryParams = {
        search: params.search,
        per_page: Math.min(params.per_page || 10, 100),
        page: params.page || 1,
        ...(params.type && { type: params.type }),
        ...(params.subtype && { subtype: params.subtype }),
      };

      logger.info("Searching site", { queryParams });

      const response = await this.client.get("/search", { params: queryParams });

      return {
        results: response.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          type: item.type,
          subtype: item.subtype,
        })),
        total: response.headers["x-wp-total"],
        totalPages: response.headers["x-wp-totalpages"],
        currentPage: queryParams.page,
        searchTerm: params.search,
      };
    } catch (error) {
      throw new Error(
        `Failed to search site: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
