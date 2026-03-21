import { ExpenseCategory } from "../enums";

export interface CreateExpenseDto {
  propertyId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: string;
  maintenanceRequestId?: string;
}

export interface UpdateExpenseDto {
  category?: ExpenseCategory;
  amount?: number;
  description?: string;
  expenseDate?: string;
  maintenanceRequestId?: string | null;
}

export interface ExpenseFilterDto {
  propertyId?: string;
  category?: ExpenseCategory;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}
