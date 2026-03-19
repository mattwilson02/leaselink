"use client";

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
import { useState } from "react";
import {
  PropertyStatus,
  PROPERTY_STATUS_TRANSITIONS,
  PROPERTY_STATUS_LABELS,
} from "@leaselink/shared";

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: PropertyStatus;
  onConfirm: (newStatus: PropertyStatus) => void;
  isUpdating?: boolean;
}

export function ChangeStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  onConfirm,
  isUpdating = false,
}: ChangeStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<PropertyStatus | null>(
    null
  );

  const validTransitions = PROPERTY_STATUS_TRANSITIONS[currentStatus] || [];

  function handleConfirm() {
    if (selectedStatus) {
      onConfirm(selectedStatus);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change property status</DialogTitle>
          <DialogDescription>
            Current status:{" "}
            <span className="font-medium">
              {PROPERTY_STATUS_LABELS[currentStatus]}
            </span>
          </DialogDescription>
        </DialogHeader>
        {validTransitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No status transitions are available from the current status.
          </p>
        ) : (
          <div className="space-y-4">
            <Select
              value={selectedStatus || ""}
              onValueChange={(value) => {
                if (value) setSelectedStatus(value as PropertyStatus);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {validTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PROPERTY_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
