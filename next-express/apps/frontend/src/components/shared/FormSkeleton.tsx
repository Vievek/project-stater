import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  fieldCount?: number;
  showSubmitButton?: boolean;
}

export function FormSkeleton({ fieldCount = 3, showSubmitButton = true }: FormSkeletonProps) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Label Skeleton */}
          <Skeleton className="h-4 w-16" />
          {/* Input Skeleton */}
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {showSubmitButton && (
        <div className="pt-2">
          <Skeleton className="h-10 w-full" />
        </div>
      )}
    </div>
  );
}
