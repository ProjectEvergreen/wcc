import './todo-list-item.jsx';

export default class TodoList extends HTMLElement {
  constructor() {
    super();
    this.todos = [];
  }

  connectedCallback() {
    this.render();

    // TODO shim addEventListener
    if (document.addEventListener) {
      document.addEventListener('deleteTodo', (event) => this.deleteTodo(event.detail));
      document.addEventListener('completeTodo', (event) => this.completeTodo(event.detail));
    }
  }

  addTodo() {
    // TODO e.preventDefault();
    console.log('adding...');
    const inputElement = this.getElementsByTagName('input')[0];
    const userInput = inputElement.value;

    if (userInput && userInput !== '') {
      const now = Date.now();

      this.todos = [
        ...this.todos,
        {
          completed: true,
          task: userInput,
          id: now,
          created: now
        }
      ];

      inputElement.value = '';

      this.render();
    } else {
      console.warn('invalid input, please try again'); // eslint-disable-line
    }

    return false;
  }

  completeTodo(todoId) {
    console.log('completing (or uncompleting)...', todoId);
    const updatedTodos = this.todos.map(todo => {
      todo.completed = todoId === todo.id ? !todo.completed : todo.completed;

      return todo;
    });

    this.todos = [...updatedTodos];
    this.render();
  }

  deleteTodo(todoId) {
    console.log('deleting...', todoId);
    this.todos = this.todos.filter((todo) => {
      return todo.id !== todoId;
    });
    this.render();
  }

  // TODO
  // edit
  // badge + counter
  // hydration + local storage
  // header / footer / css
  // <form onsubmit={(e) => { this.addTodo(e); }}>
  render() {
    const { todos } = this;
    const list = this.todos.map((todo) => `
      <li>
        <todo-list-item
          todo='${JSON.stringify(todo)}'
        ></todo-list-item>
      </li>
    `).join('');

    return (
      <div>
        <h3><u>My Todo List 📝</u></h3>
        <p>You have {todos.length} TODOs left</p>

        <form>
          <input class="todo-input" type="text" placeholder="Food Shopping" required/>
          <button class="add-todo" type="button" onclick={this.addTodo}>+ Add</button>
        </form>

        <ol>
          {list}
        </ol>

      </div>
    );
  }
}

customElements.define('todo-list', TodoList);