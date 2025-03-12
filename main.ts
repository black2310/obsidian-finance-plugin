import { App, Modal, Plugin, ItemView, WorkspaceLeaf } from "obsidian";

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

class FinancePluginView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  private amountPerDay: number = 0;
  private today: string = new Date().toISOString().split("T")[0];
  private untilDate: string; // дата до какого числа у нас сумму;

  getViewType(): string {
    return "finance-view"; // Возвращаем уникальный идентификатор
  }

  getDisplayText(): string {
    return "Finance Panel"; // Название панели
  }

  getIcon(): string {
    return "dollar-sign"; // Иконка для панели
  }

  private changeInputHandler(el: HTMLInputElement) {
    el.addEventListener("input", (evt: Event) => {
      console.log(evt);
      // Добавляем обработчик события input
      // const value = (evt.target as HTMLInputElement).value;
    });
  }

  private setUntilDate(el: HTMLInputElement) {
    el.addEventListener("change", (evt: Event) => {
      this.untilDate = (evt.target as HTMLInputElement).value;
      console.log();
    });
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h2", { text: "Welcome to Finance Plugin!" });

    container.createEl("p", { text: "Введите сумму:" });
    container.createEl("input", undefined, (el) => this.changeInputHandler(el));

    container.createEl("p", { text: "Срок (до какого числа):" });
    container.createEl("input", { type: "date" }, (el) =>
      this.setUntilDate(el)
    );

    container.createEl("p", {
      text: `Срок (до какого числа):${this.amountPerDay}`,
    });
  }

  async onClose() {
    // Очистка ресурсов, если нужно
  }
}

class BudgetSettingModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  private untilDate: string;

  private changeInputHandler(el: HTMLInputElement) {
    el.addEventListener("input", (evt: Event) => {
      console.log(evt);
      // Добавляем обработчик события input
      // const value = (evt.target as HTMLInputElement).value;
    });
  }

  private setUntilDate(el: HTMLInputElement) {
    el.addEventListener("change", (evt: Event) => {
      this.untilDate = (evt.target as HTMLInputElement).value;
      console.log();
    });
  }

  private saveButtonHandler(el: HTMLButtonElement) {
    el.addEventListener("click", () => {
      console.log("save");
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.setText("Woah!");

    const container = this.containerEl.children[1];
    container.empty();

    const wrapper = container.createDiv({
      cls: ["w-full", "flex-col", "justify-center", "align-center"],
    });
    wrapper.createEl("h2", { text: "Настройте бюджет" });

    // форма
    const form = wrapper.createDiv({
      cls: ["w-full", "flex-col", "justify-center", "align-center"],
    });

    form.createEl("span", { text: "Введите сумму:" });
    form.createEl("input", undefined, (el) => this.changeInputHandler(el));

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
