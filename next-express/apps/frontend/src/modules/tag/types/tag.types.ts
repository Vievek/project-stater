import { Todo } from '../../todo/types/todo.types';

export interface Tag {
  id: string;
  name: string;
  todos?: Todo[];
  createdAt: Date;
  updatedAt: Date;
}

// Omit auto-generated fields for creation
export type CreateTagInput = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateTagInput = Partial<CreateTagInput>;