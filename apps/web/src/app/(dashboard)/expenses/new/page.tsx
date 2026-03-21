"use client";

import { useRouter } from "next/navigation";
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
import { ExpenseForm, type ExpenseFormValues } from "@/components/expenses/expense-form";
import { useCreateExpense } from "@/hooks/use-expenses";
import { toast } from "sonner";

export default function NewExpensePage() {
  const router = useRouter();
  const createMutation = useCreateExpense();

  function handleSubmit(data: ExpenseFormValues) {
    createMutation.mutate(
      {
        propertyId: data.propertyId,
        category: data.category,
        amount: data.amount,
        description: data.description,
        expenseDate: data.expenseDate,
        ...(data.maintenanceRequestId
          ? { maintenanceRequestId: data.maintenanceRequestId }
          : {}),
      },
      {
        onSuccess: (result) => {
          toast.success("Expense created.");
          router.push(`/expenses/${result?.expense?.id ?? ""}`);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to create expense."
          );
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
          <p className="text-muted-foreground">
            Record a new expense for a property.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>
            Fill in the details for this expense.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Expense"
          />
        </CardContent>
      </Card>
    </div>
  );
}
