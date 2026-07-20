"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DynamicForm, FieldConfig } from "@/components/shared/DynamicForm";
import { createTagSchema, updateTagSchema, CreateTagSchemaType, UpdateTagSchemaType } from "../types/tag.zod";
import { createTagAction, updateTagAction } from "../actions/tag.actions";
import { Tag } from "../types/tag.types";

interface TagFormProps {
  initialData?: Tag;
}

export function TagForm({ initialData }: TagFormProps) {
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
          await updateTagAction(initialData.id, values);
        } else {
          await createTagAction(values);
        }
        router.push("/tag");
        router.refresh();
      } catch (error) {
        console.error("Form submission error", error);
        // Handle error state (e.g. toast)
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">{isEditing ? "Edit" : "Create"} Tag</h2>
      <DynamicForm
        schema={isEditing ? updateTagSchema : createTagSchema}
        fields={fields}
        defaultValues={initialData || {}}
        onSubmit={onSubmit}
        submitLabel={isEditing ? "Save Changes" : "Create"}
        isPending={isPending}
      />
    </div>
  );
}