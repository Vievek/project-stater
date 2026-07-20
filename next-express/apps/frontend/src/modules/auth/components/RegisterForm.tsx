"use client";

import { useTransition } from "react";
import Link from "next/link";
import { registerAction } from "../actions/auth.actions";
import { registerSchema } from "../types/auth.zod";
import { DynamicForm, FieldConfig } from "@/components/shared/DynamicForm";
import { handleError } from "@/lib/utils/error-handler";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";

const registerFields: FieldConfig<any>[] = [
  { name: "name", label: "Name", placeholder: "John Doe" },
  { name: "email", label: "Email", type: "email", placeholder: "m@example.com" },
  { name: "password", label: "Password", type: "password" },
];

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    startTransition(async () => {
      try {
        await registerAction(values);
      } catch (error) {
        handleError(error);
      }
    });
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Register</CardTitle>
        <CardDescription className="text-center">Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <DynamicForm
          schema={registerSchema}
          fields={registerFields}
          onSubmit={onSubmit}
          submitLabel="Register"
          isPending={isPending}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-center text-sm w-full pt-4 border-t">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-primary">
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
