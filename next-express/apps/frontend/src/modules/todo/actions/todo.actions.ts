"use server";

import { revalidatePath } from "next/cache";
import { todoService } from "../services/todo.service";
import { CreateTodoInput, UpdateTodoInput } from "../types/todo.types";

export async function getTodosAction(params?: Record<string, any>) {
  try {
    return await todoService.getAll(params);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Todos");
  }
}

export async function getTodoByIdAction(id: string) {
  try {
    return await todoService.getById(id);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Todo");
  }
}

export async function createTodoAction(data: CreateTodoInput) {
  try {
    const result = await todoService.create(data);
    revalidatePath('/todo');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create Todo");
  }
}

export async function updateTodoAction(id: string, data: UpdateTodoInput) {
  try {
    const result = await todoService.update(id, data);
    revalidatePath('/todo');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update Todo");
  }
}

export async function deleteTodoAction(id: string) {
  try {
    await todoService.delete(id);
    revalidatePath('/todo');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete Todo");
  }
}

export async function deleteAllTodosAction() {
  try {
    await todoService.deleteAll();
    revalidatePath('/todo');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete all Todos");
  }
}

export async function getTodosSummaryAction() {
  try {
    return await todoService.getSummary();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Todo summary");
  }
}