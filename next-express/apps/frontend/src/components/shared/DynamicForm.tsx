"use client";

import React from "react";
import { useForm, DefaultValues, Path, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type FieldConfig<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  type?: "text" | "password" | "email" | "number" | "date";
  placeholder?: string;
  description?: string;
};

interface DynamicFormProps<TFieldValues extends FieldValues> {
  schema: z.ZodType<any, any, any>;
  fields: FieldConfig<TFieldValues>[];
  defaultValues?: DefaultValues<TFieldValues>;
  onSubmit: (values: TFieldValues) => Promise<void> | void;
  submitLabel?: string;
  isPending?: boolean;
}

export function DynamicForm<TFieldValues extends FieldValues>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitLabel = "Submit",
  isPending = false,
}: DynamicFormProps<TFieldValues>) {
  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        {fields.map((field) => (
          <FormField
            key={String(field.name)}
            control={form.control}
            name={field.name as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    {...formField}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={isPending || form.formState.isSubmitting} className="w-full">
          {isPending || form.formState.isSubmitting ? "Please wait..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
