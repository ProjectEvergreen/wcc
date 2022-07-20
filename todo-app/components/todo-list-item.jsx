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

  render() {
    const { completed, task } = this.todo;
    const completionStatus = completed ? '✅' : '⛔';
    
    return (
      <span>
        {task}

        <span>{completionStatus}</span>
            
      </span>
    );
  }
}

customElements.define('todo-list-item', TodoListItem);