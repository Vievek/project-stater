"use client";

import { useTransition } from "react";
import Link from "next/link";
import { loginAction } from "../actions/auth.actions";
import { loginSchema } from "../types/auth.zod";
import { DynamicForm, FieldConfig } from "@/components/shared/DynamicForm";
import { handleError } from "@/lib/utils/error-handler";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";

const loginFields: FieldConfig<any>[] = [
  { name: "email", label: "Email", type: "email", placeholder: "m@example.com" },
  { name: "password", label: "Password", type: "password" },
];

export function LoginForm() {
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    startTransition(async () => {
      try {
        await loginAction(values);
      } catch (error) {
        handleError(error);
      }
    });
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <CardDescription className="text-center">Enter your email below to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <DynamicForm
          schema={loginSchema}
          fields={loginFields}
          onSubmit={onSubmit}
          submitLabel="Login"
          isPending={isPending}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-center text-sm w-full pt-4 border-t">
          Don't have an account?{" "}
          <Link href="/register" className="underline hover:text-primary">
            Register
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
