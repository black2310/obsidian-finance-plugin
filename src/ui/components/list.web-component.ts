export class ListExpenses extends HTMLElement {
  public static readonly TAG_NAME = "list-expenses";
  private listElement: HTMLUListElement;

  constructor() {
    super();

    // Создаем Shadow DOM
    const shadow = this.attachShadow({ mode: "open" });

    // Создаем элемент <ul>
    this.listElement = document.createElement("ul");

    // Добавляем стили (опционально)
    const style = document.createElement("style");
    style.textContent = `
      ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
      }
      li {
        padding: 8px;
        border-bottom: 1px solid #ccc;
      }
      li:last-child {
        border-bottom: none;
      }
    `;

    // Добавляем стили и список в Shadow DOM
    shadow.appendChild(style);
    shadow.appendChild(this.listElement);
  }

  // Метод для добавления элементов в список
  public addItem(text: string): void {
    const li = document.createElement("li");
    li.textContent = text;
    this.listElement.appendChild(li);
  }

  // Метод для удаления всех элементов списка
  public clearItems(): void {
    this.listElement.innerHTML = "";
  }

  // Метод, который вызывается при добавлении элемента в DOM
  connectedCallback() {
    console.log("CustomList added to the DOM");
  }

  // Метод, который вызывается при удалении элемента из DOM
  disconnectedCallback() {
    console.log("CustomList removed from the DOM");
  }
}

customElements.define(ListExpenses.TAG_NAME, ListExpenses);
