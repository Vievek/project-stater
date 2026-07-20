import { User } from '../../user/types/user.types';
import { Tag } from '../../tag/types/tag.types';
import { Category } from '../../category/types/category.types';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
  user?: User;
  tags?: Tag[];
  categories?: Category[];
  createdAt: Date;
  updatedAt: Date;
}

// Omit auto-generated fields for creation
export type CreateTodoInput = Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateTodoInput = Partial<CreateTodoInput>;