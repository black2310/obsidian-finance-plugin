import { App, Modal, Plugin, ItemView, WorkspaceLeaf, Notice } from "obsidian";

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

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.setText("Status Bar Text");

    this.addCommand({
      id: "open-modal-setting-budget",
      name: "Настроить бюджет",
      callback: () => {
        new BudgetSettingModal(this.app).open();
      },
    });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
    );
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

  private getCurrentPeriodBudget() {
    // Получаем данные из localStorage или других источников
    return this.app.loadLocalStorage("totalBudget");
  }

  private settingsBudgetHandler(el: HTMLButtonElement) {
    el.addEventListener("click", () => {
      new BudgetSettingModal(this.app).open();
    });

    // Подписываемся на кастомное событие
    document.addEventListener("totalBudgetSaved", (event: CustomEvent) => {
      const periodBudget = event.detail;
      this.renderBudgetInfo(periodBudget);
    });
  }

  private renderBudgetInfo(periodBudget) {
    const container = this.containerEl.children[1];
    container.empty();

    const wrapper = container.createDiv({
      cls: ["w-full", "flex-col", "justify-center", "align-center"],
    });

    wrapper.createEl("h2", {
      text: `${periodBudget.totalAmount} до ${periodBudget.endDate}:`,
    });
  }

  async onOpen() {
    const container = this.containerEl.children[1];

    const periodBudget = this.getCurrentPeriodBudget();

    if (!periodBudget) {
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
      const periodBudget = {
        totalAmount: this.totalAmount,
        endDate: this.endDate,
      };

      this.app.saveLocalStorage("totalBudget", periodBudget);

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
