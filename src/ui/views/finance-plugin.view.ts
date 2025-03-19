import { ItemView, WorkspaceLeaf } from "obsidian";
import { BudgetService, BudgetInfo } from "@/services/budget.service";
import { formatCurrency } from "@/utils/index";
import { BudgetSettingModal } from "@/ui/modals/budget-settings.modal";
import { List } from "@/ui/components/list.web-component";

export class FinancePluginView extends ItemView {
  private budgetService: BudgetService;
  private budgetSettingModal;
  private listExpenses;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.budgetService = new BudgetService(this.app);
    this.budgetSettingModal = new BudgetSettingModal(
      this.app,
      this.budgetService
    );

    this.listExpenses = document.createElement(List.TAG_NAME);

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
    const customEvent = event as CustomEvent<BudgetInfo>;
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

    // Сумма доступная на текущий день
    wrapper.createEl("h3", {
      text: `${formatCurrency(periodBudget.amountOnDay as number)} на сегодня`,
    });

    wrapper.createEl(
      "input",
      { type: "number", cls: "w-full", value: "0" },
      (el) => {
        this.processExpenseAmount(el);
      }
    );

    const listExpenses = document.createElement(
      ListExpenses.TAG_NAME
    ) as ListExpenses;

    wrapper.appendChild(listExpenses);
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
  }
}
