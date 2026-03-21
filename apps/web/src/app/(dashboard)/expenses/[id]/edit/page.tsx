"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseForm, type ExpenseFormValues } from "@/components/expenses/expense-form";
import { useExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { toast } from "sonner";

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useExpense(id);
  const expense = data?.expense;
  const updateMutation = useUpdateExpense(id);

  function handleSubmit(data: ExpenseFormValues) {
    updateMutation.mutate(
      {
        category: data.category,
        amount: data.amount,
        description: data.description,
        expenseDate: data.expenseDate,
        ...(data.maintenanceRequestId !== undefined
          ? { maintenanceRequestId: data.maintenanceRequestId }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success("Expense updated.");
          router.push(`/expenses/${id}`);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to update expense."
          );
        },
      }
    );
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

  // Convert ISO date to YYYY-MM-DD for the date input
  const expenseDateValue = expense.expenseDate
    ? expense.expenseDate.slice(0, 10)
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/expenses/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Expense</h1>
          <p className="text-muted-foreground">{expense.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>Update the details for this expense.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            mode="edit"
            defaultValues={{
              propertyId: expense.propertyId,
              category: expense.category as import("@leaselink/shared").ExpenseCategory,
              amount: expense.amount,
              description: expense.description,
              expenseDate: expenseDateValue,
              maintenanceRequestId: expense.maintenanceRequestId ?? undefined,
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
