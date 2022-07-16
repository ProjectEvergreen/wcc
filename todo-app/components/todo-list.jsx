export default class TodoList extends HTMLElement {
    constructor() {
        super();
        this.todos = [];
    }
    connectedCallback() {
        this.render();
    }
    render(props = {}) {
        this.innerHTML = `<div>
        <h3><u>My Todo List 📝</u></h3>
      </div>`;
    }
}
customElements.define('todo-list', TodoList);