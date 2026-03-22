import { ExpenseCategory } from "../enums";

export interface Expense {
  id: string;
  propertyId: string;
  managerId: string;
  maintenanceRequestId: string | null;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptBlobKey: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string | null;
}
