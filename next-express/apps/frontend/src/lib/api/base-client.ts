import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export class BaseApiClient<T, CreateDTO = any, UpdateDTO = any> {
  constructor(protected readonly basePath: string) {}

  protected async fetch<R>(path: string, init?: RequestInit): Promise<ApiResponse<R>> {
    const url = `${API_BASE}${this.basePath}${path}`;
    
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');

    // Automatically inject auth token if running on the server
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (e) {
      // cookies() throws if called outside a Next.js request context (e.g. in some client contexts)
    }

    const res = await fetch(url, { ...init, headers });
    return res.json() as Promise<ApiResponse<R>>;
  }

  async getAll(init?: RequestInit): Promise<ApiResponse<T[]>> {
    return this.fetch<T[]>('', init);
  }

  async getById(id: string, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetch<T>(`/${id}`, init);
  }

  async create(data: CreateDTO, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetch<T>('', {
      ...init,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateDTO, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetch<T>(`/${id}`, {
      ...init,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string, init?: RequestInit): Promise<ApiResponse<void>> {
    return this.fetch<void>(`/${id}`, {
      ...init,
      method: 'DELETE',
    });
  }
}

//TODO : run and check 
//TODO : work on scripts and generators