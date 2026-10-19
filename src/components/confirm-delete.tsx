"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmDeleteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is being deleted, named so the reader recognises it. */
  subject: string;
  /** The consequence, in words. */
  consequence?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

/**
 * Confirmation for an irreversible action.
 *
 * The question names the object, because "Are you sure?" beside a table row
 * gives the reader nothing to check against. Pair it with a success toast so
 * the outcome is confirmed rather than assumed.
 */
export function ConfirmDelete({
  open,
  onOpenChange,
  subject,
  consequence = "This cannot be undone.",
  confirmLabel = "Delete",
  onConfirm,
}: ConfirmDeleteProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {subject}?</AlertDialogTitle>
          <AlertDialogDescription>
            {subject} will be permanently deleted. {consequence}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Row-level state helper: keeps each row's confirmation independent. */
export function useConfirmDelete() {
  const [open, setOpen] = React.useState(false);
  return { open, setOpen, request: () => setOpen(true) };
}
