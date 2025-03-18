import { Plugin } from "obsidian";
import { BudgetService } from "./src/services/budget.service";
import { FinancePluginView } from "./src/ui/views/finance-plugin.view";
import { BudgetSettingModal } from "./src/ui/modals/budget-settings.modal";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "default",
};

export default class FinancePlugin extends Plugin {
  settings: MyPluginSettings;
  budgetService: BudgetService;

  async onload() {
    await this.loadSettings();

    // Инициализация BudgetService
    this.budgetService = new BudgetService(this.app);

    this.registerView(
      "finance-view",
      (leaf) => new FinancePluginView(leaf, this.budgetService)
    );

    this.addRibbonIcon("dollar-sign", "Open Finance Panel", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-modal-setting-budget",
      name: "Настроить бюджет",
      callback: () => {
        new BudgetSettingModal(this.app, this.budgetService).open();
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
