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
          canManageCategories: true,
          canManageTags: true,
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
