"use server";

import { revalidatePath } from "next/cache";
import { tagService } from "../services/tag.service";
import { CreateTagInput, UpdateTagInput } from "../types/tag.types";

export async function getTagsAction(params?: Record<string, any>) {
  try {
    return await tagService.getAll(params);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Tags");
  }
}

export async function getTagByIdAction(id: string) {
  try {
    return await tagService.getById(id);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Tag");
  }
}

export async function createTagAction(data: CreateTagInput) {
  try {
    const result = await tagService.create(data);
    revalidatePath('/tag');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create Tag");
  }
}

export async function updateTagAction(id: string, data: UpdateTagInput) {
  try {
    const result = await tagService.update(id, data);
    revalidatePath('/tag');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update Tag");
  }
}

export async function deleteTagAction(id: string) {
  try {
    await tagService.delete(id);
    revalidatePath('/tag');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete Tag");
  }
}

export async function deleteAllTagsAction() {
  try {
    await tagService.deleteAll();
    revalidatePath('/tag');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete all Tags");
  }
}

export async function getTagsSummaryAction() {
  try {
    return await tagService.getSummary();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Tag summary");
  }
}