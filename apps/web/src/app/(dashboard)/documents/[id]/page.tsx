"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentFolderBadge } from "@/components/documents/document-folder-badge";
import { useDocument, useDocumentDownload } from "@/hooks/use-documents";
import { formatFileSize } from "@/lib/utils";
import { toast } from "sonner";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: docData, isLoading } = useDocument(id);
  const downloadMutation = useDocumentDownload();

  const document = docData?.document;

  function handleDownload() {
    if (!document) return;
    downloadMutation.mutate(document.id, {
      onSuccess: (result) => {
        window.open(result.downloadUrl, "_blank");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to generate download link."
        );
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Document not found</h1>
        <Link href="/documents">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </Link>
      </div>
    );
  }

  const isPdf = document.blobName?.toLowerCase().endsWith(".pdf");
  const isImage =
    document.blobName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/documents">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {document.name}
            </h1>
            <DocumentFolderBadge folder={document.folder} />
          </div>
        </div>
        <Button
          onClick={handleDownload}
          disabled={downloadMutation.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          {downloadMutation.isPending ? "Generating link..." : "Download"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {isPdf ? (
                <iframe
                  src={document.blobName}
                  className="w-full h-96 border rounded"
                  title={document.name}
                />
              ) : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={document.blobName}
                  alt={document.name}
                  className="max-w-full rounded border"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                  <File className="h-12 w-12" />
                  <p className="text-sm">
                    Preview not available. Download the file to view it.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Folder</p>
                <div className="mt-1">
                  <DocumentFolderBadge folder={document.folder} />
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">File Size</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(document.fileSize)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-sm text-muted-foreground">
                  v{document.version}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Uploaded</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(document.createdAt)}
                </p>
              </div>

              {document.viewedAt && (
                <div>
                  <p className="text-sm font-medium">Last Viewed</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(document.viewedAt)}
                  </p>
                </div>
              )}

              {document.updatedAt && (
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(document.updatedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
