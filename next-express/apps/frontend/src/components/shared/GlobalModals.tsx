"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/**
 * Registry of available modals.
 * Add new modal components here mapped by a unique key.
 */
const ModalRegistry: Record<string, React.FC<any>> = {
  // exampleModal: dynamic(() => import("./modals/ExampleModal")),
};

export function GlobalModals() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // The key of the modal to render (e.g. ?modal=exampleModal)
  const activeModalKey = searchParams.get("modal");

  useEffect(() => {
    if (activeModalKey && ModalRegistry[activeModalKey]) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [activeModalKey]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Remove the 'modal' search param when closing
      const params = new URLSearchParams(searchParams.toString());
      params.delete("modal");
      // Remove any modal-specific params if needed, or just clear them all
      // but usually just removing the 'modal' key is enough.
      router.push(`?${params.toString()}`);
    }
  };

  const ActiveModalComponent = activeModalKey ? ModalRegistry[activeModalKey] : null;

  if (!ActiveModalComponent) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {/* The active modal component receives the searchParams as props if needed */}
        <ActiveModalComponent searchParams={Object.fromEntries(searchParams.entries())} />
      </DialogContent>
    </Dialog>
  );
}
