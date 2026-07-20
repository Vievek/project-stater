import { BaseApiClient, ApiResponse } from "@/lib/api/base-client";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "../types/category.types";

class CategoryApiClient extends BaseApiClient<Category> {
  constructor() {
    super("/api/categorys");
  }

  async getAll(params?: Record<string, any>): Promise<ApiResponse<Category[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.fetch<Category[]>(`${query ? '?' + query : ''}`);
  }

  async getById(id: string): Promise<ApiResponse<Category>> {
    return this.fetch<Category>(`/${id}`);
  }

  async create(data: CreateCategoryInput): Promise<ApiResponse<Category>> {
    return this.fetch<Category>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateCategoryInput): Promise<ApiResponse<Category>> {
    return this.fetch<Category>(`/${id}`, {
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

export const categoryApi = new CategoryApiClient();