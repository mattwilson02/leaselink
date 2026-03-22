"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, File, CheckCircle, ChevronDown, ChevronUp, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DocumentFolderBadge } from "@/components/documents/document-folder-badge";
import { useDocument, useDocumentDownload } from "@/hooks/use-documents";
import { useSignature } from "@/hooks/use-signature";
import { formatFileSize } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { DocumentFolder } from "@leaselink/shared";

const SIGNABLE_FOLDERS: string[] = [
  DocumentFolder.LEASE_AGREEMENTS,
  DocumentFolder.SIGNED_DOCUMENTS,
];

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: docData, isLoading } = useDocument(id);
  const downloadMutation = useDocumentDownload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewFetchedRef = useRef(false);

  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null);
  const signatureImageFetchedRef = useRef(false);

  const [metadataOpen, setMetadataOpen] = useState(false);

  const document = docData?.data;

  const isSignableFolder = !!document && SIGNABLE_FOLDERS.includes(document.folder);

  const { data: signature, isLoading: isSignatureLoading } = useSignature(
    isSignableFolder ? id : ""
  );

  useEffect(() => {
    if (document?.id && !previewFetchedRef.current) {
      previewFetchedRef.current = true;
      apiClient
        .post<{ downloadUrl: string }>("/documents/download", {
          documentId: document.id,
        })
        .then((result) => setPreviewUrl(result.downloadUrl))
        .catch(() => {});
    }
  }, [document?.id]);

  useEffect(() => {
    if (signature?.signatureImageKey && !signatureImageFetchedRef.current) {
      signatureImageFetchedRef.current = true;
      apiClient
        .get<{ downloadUrl: string }>(`/documents/${id}/signature/image`)
        .then((result) => setSignatureImageUrl(result.downloadUrl))
        .catch(() => {});
    }
  }, [signature?.signatureImageKey, id]);

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

  const fileName = (document.name || document.blobName || "").toLowerCase();
  const isPdf = fileName.endsWith(".pdf");
  const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/);

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
              {!previewUrl ? (
                <div className="flex items-center justify-center h-48">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-96 border rounded"
                  title={document.name}
                />
              ) : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
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

          {/* Signature section — only shown for signable folders */}
          {isSignableFolder && (
            <>
              {isSignatureLoading ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Signature</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ) : signature ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Signature</CardTitle>
                      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {signatureImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={signatureImageUrl}
                        alt="Signature"
                        className="max-w-xs rounded border bg-white p-2"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-20 rounded border bg-muted/40 text-muted-foreground">
                        <PenLine className="h-6 w-6 mr-2" />
                        <span className="text-sm">Signature image unavailable</span>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <p className="text-sm font-medium">Signed by</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {signature.signedBy}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Signed at</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatDateTime(signature.signedAt)}
                      </p>
                    </div>

                    <Separator />

                    <button
                      type="button"
                      onClick={() => setMetadataOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between text-sm font-medium hover:text-foreground/80 transition-colors"
                    >
                      <span>Metadata</span>
                      {metadataOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {metadataOpen && (
                      <div className="space-y-3 rounded-md bg-muted/40 p-3 text-sm">
                        <div>
                          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                            IP Address
                          </p>
                          <p className="mt-0.5 text-muted-foreground font-mono">
                            {signature.ipAddress ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                            User Agent
                          </p>
                          <p className="mt-0.5 text-muted-foreground break-all">
                            {signature.userAgent ?? "—"}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                    <PenLine className="h-3.5 w-3.5" />
                    Awaiting Signature
                  </Badge>
                </div>
              )}
            </>
          )}
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
