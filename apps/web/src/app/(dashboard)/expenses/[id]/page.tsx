"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ExpenseCategoryBadge } from "@/components/expenses/expense-category-badge";
import { ReceiptUpload } from "@/components/expenses/receipt-upload";
import { useExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useExpense(id);
  const expense = data?.expense;
  const deleteMutation = useDeleteExpense();
  const [showDelete, setShowDelete] = useState(false);

  function handleDelete() {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Expense deleted.");
        router.push("/expenses");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete expense."
        );
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Expense not found</h1>
        <Link href="/expenses">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Expenses
          </Button>
        </Link>
      </div>
    );
  }

  const isImage =
    expense.receiptBlobKey &&
    /\.(jpg|jpeg|png|gif|webp)$/i.test(expense.receiptBlobKey);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {expense.description}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <ExpenseCategoryBadge category={expense.category} />
              <span className="text-2xl font-bold text-foreground">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/expenses/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Expense Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(expense.expenseDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Amount</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Property</p>
                    <Link
                      href={`/properties/${expense.propertyId}`}
                      className="text-sm hover:underline"
                    >
                      View property
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <div className="mt-1">
                      <ExpenseCategoryBadge category={expense.category} />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                  {expense.description}
                </p>
              </div>

              {expense.maintenanceRequestId && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Maintenance Request</p>
                    <Link
                      href={`/maintenance/${expense.maintenanceRequestId}`}
                      className="mt-1 text-sm hover:underline"
                    >
                      View maintenance request
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              {expense.receiptBlobKey ? (
                <div className="space-y-3">
                  {isImage ? (
                    <div className="overflow-hidden rounded-md border">
                      <img
                        src={expense.receiptBlobKey}
                        alt="Receipt"
                        className="w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md border p-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        PDF Receipt
                      </span>
                    </div>
                  )}
                  <a
                    href={expense.receiptBlobKey}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Receipt
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No receipt uploaded yet.
                  </p>
                  <ReceiptUpload expenseId={id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
