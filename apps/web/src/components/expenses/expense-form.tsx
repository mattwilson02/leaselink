"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  createExpenseSchema,
  updateExpenseSchema,
} from "@leaselink/shared";
import { useProperties } from "@/hooks/use-properties";

// Form schema: use createExpenseSchema but make expenseDate a date string for the date input
const expenseFormSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  expenseDate: z.string().min(1, "Expense date is required"),
  maintenanceRequestId: z.string().uuid().optional(),
});

// Edit schema
const expenseEditSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  amount: z.number().positive("Amount must be greater than 0").optional(),
  description: z.string().min(1, "Description is required").optional(),
  expenseDate: z.string().optional(),
  maintenanceRequestId: z.string().uuid().nullable().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type ExpenseEditFormValues = z.infer<typeof expenseEditSchema>;

interface ExpenseFormProps {
  mode?: "create" | "edit";
  defaultValues?: Partial<ExpenseFormValues>;
  onSubmit: (data: ExpenseFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ExpenseForm({
  mode = "create",
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Expense",
}: ExpenseFormProps) {
  const { data: propertiesData } = useProperties({ pageSize: 100 });
  const properties = propertiesData?.data ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      propertyId: "",
      category: ExpenseCategory.OTHER,
      amount: 0,
      description: "",
      expenseDate: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  const propertyId = watch("propertyId");
  const category = watch("category");

  function handleFormSubmit(data: ExpenseFormValues) {
    // Convert date string to ISO datetime string for the API
    const expenseDateIso = data.expenseDate.includes("T")
      ? data.expenseDate
      : new Date(data.expenseDate + "T00:00:00.000Z").toISOString();
    onSubmit({ ...data, expenseDate: expenseDateIso });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {mode === "create" && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="propertyId">Property</Label>
            <Select
              value={propertyId}
              onValueChange={(value) => {
                if (value) setValue("propertyId", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property">
                  {(value: string) => {
                    const p = properties.find((prop) => prop.id === value);
                    return p ? p.address : "Select property";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && (
              <p className="text-sm text-destructive">
                {errors.propertyId.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={category}
            onValueChange={(value) => {
              if (value) setValue("category", value as ExpenseCategory);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category">
                {(value: string) =>
                  EXPENSE_CATEGORY_LABELS[value as ExpenseCategory] ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(ExpenseCategory).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {EXPENSE_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              className="pl-7"
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expenseDate">Expense Date</Label>
          <Input
            id="expenseDate"
            type="date"
            {...register("expenseDate")}
          />
          {errors.expenseDate && (
            <p className="text-sm text-destructive">
              {errors.expenseDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Describe the expense..."
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
