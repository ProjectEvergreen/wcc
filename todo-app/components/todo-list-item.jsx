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

  dispatchDeleteTodoEvent(id) {
    console.debug('dispatchDeleteTodoEvent', id);
    const event = new CustomEvent('deleteTodo', { detail: id });
    document.dispatchEvent(event);
  }

  render() {
    const { completed, task } = this.todo;
    const completionStatus = completed ? '✅' : '⛔';
    
    return (
      <span>
        {task}

        <span>{completionStatus}</span>

        <button onclick={() => this.dispatchDeleteTodoEvent(this.todo.id)}>❌</button>
            
      </span>
    );
  }
}

customElements.define('todo-list-item', TodoListItem);