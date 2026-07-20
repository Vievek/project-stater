"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DynamicForm, FieldConfig } from "@/components/shared/DynamicForm";
import { createTodoSchema, updateTodoSchema, CreateTodoSchemaType, UpdateTodoSchemaType } from "../types/todo.zod";
import { createTodoAction, updateTodoAction } from "../actions/todo.actions";
import { Todo } from "../types/todo.types";

interface TodoFormProps {
  initialData?: Todo;
}

export function TodoForm({ initialData }: TodoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialData;

  const fields: FieldConfig<any>[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      placeholder: "Enter title",
    },
    {
      name: "completed",
      label: "Completed",
      type: "text",
      placeholder: "Enter completed",
    },
    {
      name: "userId",
      label: "UserId",
      type: "text",
      placeholder: "Enter userId",
    }
  ];

  const onSubmit = async (values: any) => {
    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          await updateTodoAction(initialData.id, values);
        } else {
          await createTodoAction(values);
        }
        router.push("/todo");
        router.refresh();
      } catch (error) {
        console.error("Form submission error", error);
        // Handle error state (e.g. toast)
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">{isEditing ? "Edit" : "Create"} Todo</h2>
      <DynamicForm
        schema={isEditing ? updateTodoSchema : createTodoSchema}
        fields={fields}
        defaultValues={initialData || {}}
        onSubmit={onSubmit}
        submitLabel={isEditing ? "Save Changes" : "Create"}
        isPending={isPending}
      />
    </div>
  );
}