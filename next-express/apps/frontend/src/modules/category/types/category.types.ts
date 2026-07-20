import { Todo } from '../../todo/types/todo.types';

export interface Category {
  id: string;
  name: string;
  todos?: Todo[];
  createdAt: Date;
  updatedAt: Date;
}

// Omit auto-generated fields for creation
export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateCategoryInput = Partial<CreateCategoryInput>;