import { ItemView, WorkspaceLeaf } from "obsidian";
import { BudgetService, BudgetInfo } from "../../services/budget.service";
import { calculateDaysRemaining, formatCurrency } from "../../utils/index";
import { BudgetSettingModal } from "../modals/budget-settings.modal";

export class FinancePluginView extends ItemView {
  private budgetService: BudgetService;
  private budgetSettingModal;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.budgetService = new BudgetService(this.app);
    this.budgetSettingModal = new BudgetSettingModal(
      this.app,
      this.budgetService
    );
    document.addEventListener("totalBudgetSaved", this.handleBudgetSaved);
  }

  getViewType(): string {
    return "finance-view"; // Возвращаем уникальный идентификатор
  }

  getDisplayText(): string {
    return "Finance Panel"; // Название панели
  }

  getIcon(): string {
    return "dollar-sign"; // Иконка для панели
  }

  getBudgetInfo() {
    return this.budgetService.getCurrentBudget();
  }

  private handleBudgetSaved = (event: Event) => {
    const customEvent = event as CustomEvent<BudgetInfo>; // Приводим тип
    console.log("Событие получено"); // Лог для проверки
    this.renderBudgetInfo(customEvent.detail);
  };

  private settingsBudgetHandler(el: HTMLButtonElement) {
    el.addEventListener("click", () => {
      this.budgetSettingModal.open();
    });
  }

  private renderBudgetInfo(periodBudget: BudgetInfo): void {
    const container = this.containerEl.children[1];
    container.empty();

    const wrapper = container.createDiv({
      cls: ["w-full", "flex-col"],
    });

    // общая инфа в виде сумма всего и до какого числа
    wrapper.createEl("h2", {
      text: `${formatCurrency(periodBudget.totalAmount)} до ${
        periodBudget.endDate
      }`,
    });

    const daysLeft = calculateDaysRemaining(periodBudget.endDate);

    // Сумма доступная на текущий день
    wrapper.createEl("h3", {
      text: `${formatCurrency(periodBudget.amountOnDay as number)} на сегодня`,
    });

    container.createEl(
      "input",
      { type: "number", cls: "w-full", value: "0" },
      (el) => {
        this.processExpenseAmount(el);
      }
    );
  }

  private processExpenseAmount(el: HTMLInputElement): void {
    el.addEventListener("keypress", (evt: KeyboardEvent) => {
      const amount = (evt.target as HTMLInputElement)
        .value as unknown as number;

      if (evt.key === "Enter") {
        const updatedBudgetInfo = this.budgetService.setExpense(amount);
        this.renderBudgetInfo(updatedBudgetInfo);
      }
    });
  }

  async onOpen() {
    const container = this.containerEl.children[1];

    const periodBudget: BudgetInfo = this.getBudgetInfo();

    if (periodBudget.totalAmount === 0) {
      container.createEl(
        "button",
        { text: "Необходимо настроить бюджет" },
        (el) => this.settingsBudgetHandler(el)
      );
      return;
    }

    this.renderBudgetInfo(periodBudget);
  }

  async onClose() {
    document.removeEventListener("totalBudgetSaved", this.handleBudgetSaved);
    // Очистка ресурсов, если нужно
  }
}
