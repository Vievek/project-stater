import { BaseApiClient, ApiResponse } from "@/lib/api/base-client";
import { Todo, CreateTodoInput, UpdateTodoInput } from "../types/todo.types";

class TodoApiClient extends BaseApiClient<Todo> {
  constructor() {
    super("/api/todos");
  }

  async getAll(params?: Record<string, any>): Promise<ApiResponse<Todo[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.fetch<Todo[]>(`${query ? '?' + query : ''}`);
  }

  async getById(id: string): Promise<ApiResponse<Todo>> {
    return this.fetch<Todo>(`/${id}`);
  }

  async create(data: CreateTodoInput): Promise<ApiResponse<Todo>> {
    return this.fetch<Todo>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateTodoInput): Promise<ApiResponse<Todo>> {
    return this.fetch<Todo>(`/${id}`, {
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

export const todoApi = new TodoApiClient();