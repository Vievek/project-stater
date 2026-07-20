import { tagApi } from './tag.api';
import { Tag, CreateTagInput, UpdateTagInput } from '../types/tag.types';

export const tagService = {
  async getAll(params?: Record<string, any>): Promise<Tag[]> {
    const response = await tagApi.getAll(params);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Tags');
    }
    return response.data;
  },

  async getById(id: string): Promise<Tag> {
    const response = await tagApi.getById(id);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Tag');
    }
    return response.data;
  },

  async create(data: CreateTagInput): Promise<Tag> {
    const response = await tagApi.create(data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create Tag');
    }
    return response.data;
  },

  async update(id: string, data: UpdateTagInput): Promise<Tag> {
    const response = await tagApi.update(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update Tag');
    }
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response = await tagApi.delete(id);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete Tag');
    }
  },

  async deleteAll(): Promise<void> {
    const response = await tagApi.deleteAll();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete all Tags');
    }
  },

  async getSummary(): Promise<{ total: number }> {
    const response = await tagApi.getSummary();
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Tag summary');
    }
    return response.data;
  }
};