"use server";

import { revalidatePath } from "next/cache";
import { userService } from "../services/user.service";
import { CreateUserInput, UpdateUserInput } from "../types/user.types";

export async function getUsersAction(params?: Record<string, any>) {
  try {
    return await userService.getAll(params);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Users");
  }
}

export async function getUserByIdAction(id: string) {
  try {
    return await userService.getById(id);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch User");
  }
}

export async function createUserAction(data: CreateUserInput) {
  try {
    const result = await userService.create(data);
    revalidatePath('/user');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create User");
  }
}

export async function updateUserAction(id: string, data: UpdateUserInput) {
  try {
    const result = await userService.update(id, data);
    revalidatePath('/user');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update User");
  }
}

export async function deleteUserAction(id: string) {
  try {
    await userService.delete(id);
    revalidatePath('/user');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete User");
  }
}

export async function deleteAllUsersAction() {
  try {
    await userService.deleteAll();
    revalidatePath('/user');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete all Users");
  }
}

export async function getUsersSummaryAction() {
  try {
    return await userService.getSummary();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch User summary");
  }
}