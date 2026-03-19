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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MaintenanceStatus,
  MAINTENANCE_STATUS_TRANSITIONS,
  MAINTENANCE_STATUS_LABELS,
} from "@leaselink/shared";

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: MaintenanceStatus;
  onConfirm: (newStatus: MaintenanceStatus) => void;
  isUpdating?: boolean;
}

const transitionMessages: Partial<Record<MaintenanceStatus, string>> = {
  [MaintenanceStatus.IN_PROGRESS]:
    "Mark this request as in progress to indicate work has begun.",
  [MaintenanceStatus.RESOLVED]:
    "Mark this request as resolved to indicate the issue has been fixed.",
  [MaintenanceStatus.CLOSED]:
    "Close this request to archive it. This action cannot be undone.",
};

export function UpdateStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  onConfirm,
  isUpdating = false,
}: UpdateStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<MaintenanceStatus | null>(null);

  const validTransitions = MAINTENANCE_STATUS_TRANSITIONS[currentStatus] ?? [];

  function handleConfirm() {
    if (selectedStatus) {
      onConfirm(selectedStatus);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectedStatus(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update maintenance status</DialogTitle>
          <DialogDescription>
            Current status:{" "}
            <span className="font-medium">
              {MAINTENANCE_STATUS_LABELS[currentStatus]}
            </span>
          </DialogDescription>
        </DialogHeader>
        {validTransitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No status transitions are available. This request is closed.
          </p>
        ) : (
          <div className="space-y-4">
            <Select
              value={selectedStatus || ""}
              onValueChange={(value) => {
                if (value) setSelectedStatus(value as MaintenanceStatus);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {validTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {MAINTENANCE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStatus && transitionMessages[selectedStatus] && (
              <p className="text-sm text-muted-foreground">
                {transitionMessages[selectedStatus]}
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          {validTransitions.length > 0 && (
            <Button
              onClick={handleConfirm}
              disabled={!selectedStatus || isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
