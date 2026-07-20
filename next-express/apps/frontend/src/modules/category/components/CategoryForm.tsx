"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DynamicForm, FieldConfig } from "@/components/shared/DynamicForm";
import { createCategorySchema, updateCategorySchema, CreateCategorySchemaType, UpdateCategorySchemaType } from "../types/category.zod";
import { createCategoryAction, updateCategoryAction } from "../actions/category.actions";
import { Category } from "../types/category.types";

interface CategoryFormProps {
  initialData?: Category;
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialData;

  const fields: FieldConfig<any>[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter name",
    }
  ];

  const onSubmit = async (values: any) => {
    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          await updateCategoryAction(initialData.id, values);
        } else {
          await createCategoryAction(values);
        }
        router.push("/category");
        router.refresh();
      } catch (error) {
        console.error("Form submission error", error);
        // Handle error state (e.g. toast)
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">{isEditing ? "Edit" : "Create"} Category</h2>
      <DynamicForm
        schema={isEditing ? updateCategorySchema : createCategorySchema}
        fields={fields}
        defaultValues={initialData || {}}
        onSubmit={onSubmit}
        submitLabel={isEditing ? "Save Changes" : "Create"}
        isPending={isPending}
      />
    </div>
  );
}