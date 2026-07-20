import { Todo } from '../../todo/types/todo.types';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  todos?: Todo[];
  createdAt: Date;
  updatedAt: Date;
}

// Omit auto-generated fields for creation
export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateUserInput = Partial<CreateUserInput>;