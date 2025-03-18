import { App, Modal, Notice } from "obsidian";
import { BudgetService, BudgetInfo } from "../../services/budget.service";

export class BudgetSettingModal extends Modal {
  private budgetService: BudgetService;
  constructor(app: App, budgetService: BudgetService) {
    super(app);
    this.budgetService = budgetService;
  }

  private endDate: string;
  private totalAmount: number;

  private setTotalAmount(el: HTMLInputElement) {
    el.addEventListener("input", (evt: Event) => {
      this.totalAmount = (evt.target as HTMLInputElement)
        .value as unknown as number;
    });
  }

  private setUntilDate(el: HTMLInputElement) {
    el.addEventListener("change", (evt: Event) => {
      this.endDate = (evt.target as HTMLInputElement).value;
    });
  }

  private saveButtonHandler(el: HTMLButtonElement) {
    el.addEventListener("click", () => {
      const periodBudget: BudgetInfo = {
        totalAmount: this.totalAmount,
        endDate: this.endDate,
      };

      this.budgetService.saveBudget(periodBudget);

      new Notice("Бюджет успешно сохранен!");

      // Создаем и диспатчим кастомное событие, чтобы поймать его дальше
      const event = new CustomEvent("totalBudgetSaved", {
        detail: periodBudget,
        bubbles: true,
      });

      document.dispatchEvent(event);

      this.close();
    });
  }

  onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    const wrapper = container.createDiv({
      cls: ["w-full", "flex-col", "justify-center", "align-center"],
    });
    wrapper.createEl("h2", { text: "Настройте бюджет" });

    // форма
    const form = wrapper.createDiv({
      cls: ["w-full", "flex-col", "justify-center", "align-center", "gap-16"],
    });

    form.createEl("span", { text: "Введите сумму:" });
    form.createEl("input", { type: "number" }, (el) => this.setTotalAmount(el));

    form.createEl("span", { text: "Срок (до какого числа):" });
    form.createEl("input", { type: "date" }, (el) => this.setUntilDate(el));

    form.createEl("button", { text: "Сохранить" }, (el) =>
      this.saveButtonHandler(el)
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
