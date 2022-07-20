import './components/todo-list.jsx';

export default class App extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <div>
        <todo-list></todo-list>
      </div>
    );
  }
}

customElements.define('todo-app', App);