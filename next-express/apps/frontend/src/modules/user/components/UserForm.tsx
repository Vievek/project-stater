"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DynamicForm, FieldConfig } from "@/components/shared/DynamicForm";
import { createUserSchema, updateUserSchema, CreateUserSchemaType, UpdateUserSchemaType } from "../types/user.zod";
import { createUserAction, updateUserAction } from "../actions/user.actions";
import { User } from "../types/user.types";

interface UserFormProps {
  initialData?: User;
}

export function UserForm({ initialData }: UserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialData;

  const fields: FieldConfig<any>[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter name",
    },
    {
      name: "email",
      label: "Email",
      type: "text",
      placeholder: "Enter email",
    },
    {
      name: "password",
      label: "Password",
      type: "text",
      placeholder: "Enter password",
    },
    {
      name: "role",
      label: "Role",
      type: "text",
      placeholder: "Enter role",
    }
  ];

  const onSubmit = async (values: any) => {
    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          await updateUserAction(initialData.id, values);
        } else {
          await createUserAction(values);
        }
        router.push("/user");
        router.refresh();
      } catch (error) {
        console.error("Form submission error", error);
        // Handle error state (e.g. toast)
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">{isEditing ? "Edit" : "Create"} User</h2>
      <DynamicForm
        schema={isEditing ? updateUserSchema : createUserSchema}
        fields={fields}
        defaultValues={initialData || {}}
        onSubmit={onSubmit}
        submitLabel={isEditing ? "Save Changes" : "Create"}
        isPending={isPending}
      />
    </div>
  );
}