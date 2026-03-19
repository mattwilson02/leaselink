"use client";

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

interface TerminateLeaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isTerminating?: boolean;
}

export function TerminateLeaseDialog({
  open,
  onOpenChange,
  onConfirm,
  isTerminating = false,
}: TerminateLeaseDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terminate Lease</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently terminate the lease. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isTerminating}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isTerminating}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isTerminating ? "Terminating..." : "Terminate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
