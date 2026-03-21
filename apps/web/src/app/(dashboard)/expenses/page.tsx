"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Edit, Trash2, Plus, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseCategoryBadge } from "@/components/expenses/expense-category-badge";
import { ExpenseSummaryCards } from "@/components/expenses/expense-summary-cards";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { useProperties } from "@/hooks/use-properties";
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from "@leaselink/shared";
import type { Expense } from "@leaselink/shared";
import { toast } from "sonner";

const ALL = "ALL";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ExpensesPage() {
  const [propertyFilter, setPropertyFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 20;

  const { data: propertiesData } = useProperties({ pageSize: 100 });
  const properties = propertiesData?.data ?? [];

  const filters = {
    ...(propertyFilter !== ALL ? { propertyId: propertyFilter } : {}),
    ...(categoryFilter !== ALL ? { category: categoryFilter } : {}),
    ...(dateFrom ? { dateFrom: new Date(dateFrom).toISOString() } : {}),
    ...(dateTo ? { dateTo: new Date(dateTo).toISOString() } : {}),
    page,
    pageSize,
  };

  const { data, isLoading } = useExpenses(filters);
  const expenses = data?.data ?? [];
  const totalCount = data?.meta?.totalCount ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const deleteMutation = useDeleteExpense();

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Expense deleted.");
        setDeleteId(null);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete expense."
        );
      },
    });
  }

  function getPropertyAddress(propertyId: string) {
    const property = properties.find((p) => p.id === propertyId);
    return property?.address ?? propertyId;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <Link href="/expenses/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      <ExpenseSummaryCards />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <Select
          value={propertyFilter}
          onValueChange={(value) => {
            setPropertyFilter(value ?? ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All properties">
              {(value: string) => {
                if (value === ALL) return "All properties";
                return getPropertyAddress(value);
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value ?? ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories">
              {(value: string) =>
                value === ALL
                  ? "All categories"
                  : EXPENSE_CATEGORY_LABELS[value as ExpenseCategory] ?? value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {Object.values(ExpenseCategory).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {EXPENSE_CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-36"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            placeholder="From"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-36"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            placeholder="To"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">Property</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Description</TableHead>
              <TableHead className="hidden sm:table-cell">Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    No expenses recorded yet.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense: Expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(expense.expenseDate)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[160px] truncate">
                    <Link
                      href={`/properties/${expense.propertyId}`}
                      className="hover:underline"
                    >
                      {getPropertyAddress(expense.propertyId)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ExpenseCategoryBadge category={expense.category} />
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                    {expense.description}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {expense.receiptBlobKey ? (
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/expenses/${expense.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/expenses/${expense.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({totalCount}{" "}
            {totalCount === 1 ? "expense" : "expenses"})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
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
