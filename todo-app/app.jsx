import './components/todo-list.jsx';

export default class App extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <div>
        <h1>TODO App</h1>
        <todo-list></todo-list>
      </div>
    );
  }
}

customElements.define('todo-app', App);