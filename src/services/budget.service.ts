import { App } from "obsidian";
import { calculateDaysRemaining } from "../utils/index";

export type BudgetInfo = {
  totalAmount: number;
  endDate: string;
  amountOnDay?: number;
};

type Expenses = {
  date: string;
  expense: number;
};

export class BudgetService {
  private amountOnDay: number = 0; // Сумма денег на день
  // totalAmount - Общий бюджет; endDate - Дата окончания периода бюджета
  private budgetInfo: BudgetInfo = { totalAmount: 0, endDate: "" };
  private expenses: Expenses[] = [];

  constructor(private app: App) {
    this.loadBudgetFromStorage();
  }

  private loadBudgetFromStorage(): void {
    const savedBudget = this.app.loadLocalStorage("totalBudget");
    if (savedBudget) {
      this.budgetInfo = savedBudget;
    }
  }

  private saveBudgetToStorage(budgetInfo: BudgetInfo): void {
    this.app.saveLocalStorage("totalBudget", budgetInfo);
  }

  private saveExpensesToStorage(expenses: Expenses[]): void {
    this.app.saveLocalStorage("expenses", expenses);
  }

  private calculateAmountOnDay(): number {
    const daysRemaining = calculateDaysRemaining(this.budgetInfo.endDate);
    return Math.round(this.budgetInfo.totalAmount / daysRemaining);
  }

  public setExpense(expense: number): BudgetInfo {
    this.expenses.push({ expense, date: new Date().toDateString() });
    this.budgetInfo.totalAmount -= expense;

    this.saveExpensesToStorage(this.expenses);
    this.saveBudget(this.budgetInfo);

    return this.getCurrentBudget();
  }

  public saveBudget(budgetInfo: BudgetInfo): void {
    this.saveBudgetToStorage(budgetInfo);
  }

  public getCurrentBudget(): BudgetInfo {
    this.amountOnDay = this.calculateAmountOnDay();

    return {
      ...this.budgetInfo,
      amountOnDay: this.amountOnDay,
    };
  }
}
