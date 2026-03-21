import { z } from "zod";
import { ExpenseCategory } from "../enums";

export const createExpenseSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  expenseDate: z.string().datetime({ message: "Invalid expense date" }),
  maintenanceRequestId: z.string().uuid().optional(),
});

export const updateExpenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  amount: z.number().positive("Amount must be greater than 0").optional(),
  description: z.string().min(1, "Description is required").optional(),
  expenseDate: z
    .string()
    .datetime({ message: "Invalid expense date" })
    .optional(),
  maintenanceRequestId: z.string().uuid().nullable().optional(),
});

export const expenseFilterSchema = z.object({
  propertyId: z.string().uuid().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const expenseSummaryFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilterInput = z.infer<typeof expenseFilterSchema>;
export type ExpenseSummaryFilterInput = z.infer<
  typeof expenseSummaryFilterSchema
>;
