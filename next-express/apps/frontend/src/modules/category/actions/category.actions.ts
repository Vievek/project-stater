"use server";

import { revalidatePath } from "next/cache";
import { categoryService } from "../services/category.service";
import { CreateCategoryInput, UpdateCategoryInput } from "../types/category.types";

export async function getCategorysAction(params?: Record<string, any>) {
  try {
    return await categoryService.getAll(params);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Categorys");
  }
}

export async function getCategoryByIdAction(id: string) {
  try {
    return await categoryService.getById(id);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Category");
  }
}

export async function createCategoryAction(data: CreateCategoryInput) {
  try {
    const result = await categoryService.create(data);
    revalidatePath('/category');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create Category");
  }
}

export async function updateCategoryAction(id: string, data: UpdateCategoryInput) {
  try {
    const result = await categoryService.update(id, data);
    revalidatePath('/category');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update Category");
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await categoryService.delete(id);
    revalidatePath('/category');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete Category");
  }
}

export async function deleteAllCategorysAction() {
  try {
    await categoryService.deleteAll();
    revalidatePath('/category');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete all Categorys");
  }
}

export async function getCategorysSummaryAction() {
  try {
    return await categoryService.getSummary();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Category summary");
  }
}