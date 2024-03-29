class MyComponent extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('someCustomEvent', () => { console.log('it worked!'); });
    globalThis.addEventListener('someCustomEvent2', () => { console.log('it also worked!'); });
  }

  connectedCallback() {
    this.innerHTML = '<h1>It worked!</h1>';
  }
}

export default MyComponent;

customElements.define('my-component', MyComponent);