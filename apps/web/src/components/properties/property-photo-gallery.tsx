"use client";

import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_PROPERTY_PHOTOS, MAX_PHOTO_SIZE_BYTES } from "@leaselink/shared";
import { useUploadPropertyPhotos } from "@/hooks/use-properties";
import { toast } from "sonner";

interface PropertyPhotoGalleryProps {
  propertyId: string;
  photos: string[];
}

export function PropertyPhotoGallery({
  propertyId,
  photos,
}: PropertyPhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadPropertyPhotos(propertyId);
  const remainingSlots = MAX_PROPERTY_PHOTOS - photos.length;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > remainingSlots) {
      toast.error(
        `You can only upload ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"}.`
      );
      return;
    }

    const oversized = files.filter((f) => f.size > MAX_PHOTO_SIZE_BYTES);
    if (oversized.length > 0) {
      toast.error("Some files exceed the 5MB size limit.");
      return;
    }

    try {
      const fileNames = files.map((f) => f.name);
      await uploadMutation.mutateAsync(fileNames);
      toast.success("Photo upload initiated.");
    } catch {
      toast.error("Failed to upload photos.");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Photos ({photos.length}/{MAX_PROPERTY_PHOTOS})
        </h3>
        {remainingSlots > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? "Uploading..." : "Add Photos"}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      {photos.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">No photos uploaded</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              <img
                src={url}
                alt={`Property photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
