import { App, Modal, Plugin, ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { BudgetService, BudgetInfo } from "./src/services/budget.service";
import { calculateDaysRemaining } from "./src/utils";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "default",
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    this.registerView("finance-view", (leaf) => new FinancePluginView(leaf));

    this.addRibbonIcon("dollar-sign", "Open Finance Panel", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-modal-setting-budget",
      name: "Настроить бюджет",
      callback: () => {
        new BudgetSettingModal(this.app).open();
      },
    });
  }

  async activateView() {
    const { workspace } = this.app;

    // Проверяем, открыта ли уже панель
    let leaf = workspace.getLeavesOfType("finance-view")[0];

    if (!leaf) {
      // Если панель не открыта, создаём новую
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: "finance-view" });
    }

    // Активируем панель
    workspace.revealLeaf(leaf);
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// Панель справа
class FinancePluginView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
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
    return new BudgetService(this.app).getCurrentBudget();
  }

  private settingsBudgetHandler(el: HTMLButtonElement) {
    el.addEventListener("click", () => {
      new BudgetSettingModal(this.app).open();
    });

    // Подписываемся на кастомное событие
    document.addEventListener("totalBudgetSaved", (event: CustomEvent) => {
      this.renderBudgetInfo(event.detail);
    });
  }

  private renderBudgetInfo(periodBudget: BudgetInfo): void {
    const container = this.containerEl.children[1];
    container.empty();

    // форматируем числа в виде валюты, вынести в utils
    const optionsOfFormat = { locales: "currency", currency: "RUB" };
    const numberFormat = new Intl.NumberFormat("ru-RU", optionsOfFormat);

    const wrapper = container.createDiv({
      cls: ["w-full", "flex-col"],
    });

    // общая инфа в виде сумма всего и до какого числа
    wrapper.createEl("h2", {
      text: `${numberFormat.format(periodBudget.totalAmount)} до ${
        periodBudget.endDate
      }`,
    });

    const daysLeft = calculateDaysRemaining(periodBudget.endDate);

    // Сумма доступная на текущий день
    wrapper.createEl("h3", {
      text: `${numberFormat.format(
        periodBudget.amountOnDay as number
      )} на ${daysLeft} дней`,
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
        const updatedBudgetInfo = new BudgetService(this.app).setExpense(
          amount
        );
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
    // Очистка ресурсов, если нужно
  }
}

// Модальное окно с формой добавления суммы на срок
class BudgetSettingModal extends Modal {
  constructor(app: App) {
    super(app);
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

      new BudgetService(this.app).saveBudget(periodBudget);

      new Notice("Бюджет успешно сохранен!");

      // Создаем и диспатчим кастомное событие, чтобы поймать его дальше
      const event = new CustomEvent("totalBudgetSaved", {
        detail: periodBudget,
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
