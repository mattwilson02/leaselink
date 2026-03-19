"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGeneratePayments } from "@/hooks/use-payments";
import { toast } from "sonner";

interface GeneratePaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLeaseId?: string;
}

export function GeneratePaymentsDialog({
  open,
  onOpenChange,
  defaultLeaseId = "",
}: GeneratePaymentsDialogProps) {
  const [leaseId, setLeaseId] = useState(defaultLeaseId);
  const mutation = useGeneratePayments();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaseId.trim()) return;
    mutation.mutate(
      { leaseId: leaseId.trim() },
      {
        onSuccess: (result) => {
          const count = Array.isArray(result?.data) ? result.data.length : 0;
          toast.success(
            count > 0
              ? `${count} payment${count === 1 ? "" : "s"} generated successfully.`
              : "Payments generated successfully."
          );
          onOpenChange(false);
          setLeaseId(defaultLeaseId);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to generate payments."
          );
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Payments</DialogTitle>
          <DialogDescription>
            Generate monthly payment records for a lease. This will create
            upcoming payment entries for each month of the lease term.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leaseId">Lease ID</Label>
              <Input
                id="leaseId"
                placeholder="Enter lease ID"
                value={leaseId}
                onChange={(e) => setLeaseId(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!leaseId.trim() || mutation.isPending}
            >
              {mutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
