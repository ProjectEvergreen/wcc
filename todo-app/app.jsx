import './components/todo-list.jsx';
export default class App extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.render();
    }
    render() {
        this.innerHTML = `<div>
        <h1>TODO App</h1>
        <todo-list></todo-list>
      </div>`;
    }
}
customElements.define('todo-app', App);