"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useUploadExpenseReceipt,
  useConfirmExpenseReceipt,
} from "@/hooks/use-expenses";
import { toast } from "sonner";

interface ReceiptUploadProps {
  expenseId: string;
}

export function ReceiptUpload({ expenseId }: ReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useUploadExpenseReceipt(expenseId);
  const confirmMutation = useConfirmExpenseReceipt(expenseId);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select an image or PDF file.");
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      toast.error("File must be smaller than 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Get upload URL
      const { uploadUrl, blobKey } = await uploadMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
      });

      // Step 2: Upload file to blob storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage.");
      }

      // Step 3: Confirm the upload
      await confirmMutation.mutateAsync({ blobKey });

      toast.success("Receipt uploaded successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload receipt."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload Receipt"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
