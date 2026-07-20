import { categoryApi } from './category.api';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/category.types';

export const categoryService = {
  async getAll(params?: Record<string, any>): Promise<Category[]> {
    const response = await categoryApi.getAll(params);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Categorys');
    }
    return response.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await categoryApi.getById(id);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Category');
    }
    return response.data;
  },

  async create(data: CreateCategoryInput): Promise<Category> {
    const response = await categoryApi.create(data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create Category');
    }
    return response.data;
  },

  async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    const response = await categoryApi.update(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update Category');
    }
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response = await categoryApi.delete(id);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete Category');
    }
  },

  async deleteAll(): Promise<void> {
    const response = await categoryApi.deleteAll();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete all Categorys');
    }
  },

  async getSummary(): Promise<{ total: number }> {
    const response = await categoryApi.getSummary();
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Category summary');
    }
    return response.data;
  }
};