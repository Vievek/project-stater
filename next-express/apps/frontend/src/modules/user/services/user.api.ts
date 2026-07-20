import { BaseApiClient, ApiResponse } from "@/lib/api/base-client";
import { User, CreateUserInput, UpdateUserInput } from "../types/user.types";

class UserApiClient extends BaseApiClient<User> {
  constructor() {
    super("/api/users");
  }

  async getAll(params?: Record<string, any>): Promise<ApiResponse<User[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.fetch<User[]>(`${query ? '?' + query : ''}`);
  }

  async getById(id: string): Promise<ApiResponse<User>> {
    return this.fetch<User>(`/${id}`);
  }

  async create(data: CreateUserInput): Promise<ApiResponse<User>> {
    return this.fetch<User>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateUserInput): Promise<ApiResponse<User>> {
    return this.fetch<User>(`/${id}`, {
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

export const userApi = new UserApiClient();