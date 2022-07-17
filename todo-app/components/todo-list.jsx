export default class TodoList extends HTMLElement {
  constructor() {
    super();
    this.todos = [];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { todos } = this;

    return (
      <div>
        <h3><u>My Todo List 📝</u></h3>
        <p>You have {todos.length} TODOs left</p>
      </div>
    );
  }
}

customElements.define('todo-list', TodoList);