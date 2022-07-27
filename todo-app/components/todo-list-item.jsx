class TodoListItem extends HTMLElement {

  constructor() {
    super();

    this.todo = {};
  }

  static get observedAttributes () {
    return ['todo'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue !== oldValue) {
      if (name === 'todo') {
        this.todo = JSON.parse(newValue);
      }

      this.render();
    }
  }

  dispatchDeleteTodoEvent() {
    const event = new CustomEvent('deleteTodo', { detail: this.todo.id });
    document.dispatchEvent(event);
  }

  dispatchCompleteTodoEvent() {
    const event = new CustomEvent('completeTodo', { detail: this.todo.id });

    document.dispatchEvent(event);
  }

  render() {
    const { completed, task } = this.todo;
    const completionStatus = completed ? '✅' : '⛔';
    
    return (
      <span>
        {task}
        <input class="complete-todo" type="checkbox" checked={completed} onchange={this.dispatchCompleteTodoEvent}/>
        <span>{completionStatus}</span>
        <button onclick={this.dispatchDeleteTodoEvent}>❌</button>
      </span>
    );
  }
}

customElements.define('todo-list-item', TodoListItem);