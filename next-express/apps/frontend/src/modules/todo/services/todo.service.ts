import { todoApi } from './todo.api';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo.types';

export const todoService = {
  async getAll(params?: Record<string, any>): Promise<Todo[]> {
    const response = await todoApi.getAll(params);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Todos');
    }
    return response.data;
  },

  async getById(id: string): Promise<Todo> {
    const response = await todoApi.getById(id);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Todo');
    }
    return response.data;
  },

  async create(data: CreateTodoInput): Promise<Todo> {
    const response = await todoApi.create(data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create Todo');
    }
    return response.data;
  },

  async update(id: string, data: UpdateTodoInput): Promise<Todo> {
    const response = await todoApi.update(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update Todo');
    }
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response = await todoApi.delete(id);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete Todo');
    }
  },

  async deleteAll(): Promise<void> {
    const response = await todoApi.deleteAll();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete all Todos');
    }
  },

  async getSummary(): Promise<{ total: number }> {
    const response = await todoApi.getSummary();
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Todo summary');
    }
    return response.data;
  }
};