import { userApi } from './user.api';
import { User, CreateUserInput, UpdateUserInput } from '../types/user.types';

export const userService = {
  async getAll(params?: Record<string, any>): Promise<User[]> {
    const response = await userApi.getAll(params);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch Users');
    }
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await userApi.getById(id);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch User');
    }
    return response.data;
  },

  async create(data: CreateUserInput): Promise<User> {
    const response = await userApi.create(data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create User');
    }
    return response.data;
  },

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const response = await userApi.update(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update User');
    }
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response = await userApi.delete(id);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete User');
    }
  },

  async deleteAll(): Promise<void> {
    const response = await userApi.deleteAll();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete all Users');
    }
  },

  async getSummary(): Promise<{ total: number }> {
    const response = await userApi.getSummary();
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch User summary');
    }
    return response.data;
  }
};