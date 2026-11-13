import { Expense } from "../../expense/dto/expense.dto.js";

export class Category {
  id: string;
  title: string;
  userId: string;
  expenses: Expense[];
  createdAt: Date;
  updatedAt: Date;
}
