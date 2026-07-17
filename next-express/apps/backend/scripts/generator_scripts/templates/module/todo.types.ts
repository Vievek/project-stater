/**
 * Domain-owned Todo type.
 *
 * This interface lives in the domain layer — it does NOT import from any ORM
 * or generated code. Swapping Prisma never touches this file or any file that
 * imports from here (service, controller, schemas).
 */
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
