import { BaseApiClient, ApiResponse } from "@/lib/api/base-client";
import { Tag, CreateTagInput, UpdateTagInput } from "../types/tag.types";

class TagApiClient extends BaseApiClient<Tag> {
  constructor() {
    super("/api/tags");
  }

  async getAll(params?: Record<string, any>): Promise<ApiResponse<Tag[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.fetch<Tag[]>(`${query ? '?' + query : ''}`);
  }

  async getById(id: string): Promise<ApiResponse<Tag>> {
    return this.fetch<Tag>(`/${id}`);
  }

  async create(data: CreateTagInput): Promise<ApiResponse<Tag>> {
    return this.fetch<Tag>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateTagInput): Promise<ApiResponse<Tag>> {
    return this.fetch<Tag>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.fetch<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  async deleteAll(): Promise<ApiResponse<void>> {
    return this.fetch<void>("", {
      method: "DELETE",
    });
  }

  async getSummary(): Promise<ApiResponse<{ total: number }>> {
    return this.fetch<{ total: number }>("/summary");
  }

}

export const tagApi = new TagApiClient();