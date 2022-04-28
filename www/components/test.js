class TestComponent extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '<h1>This is a test</h1>';
  }

  static __hydrate__() {
    console.debug('special __hydrate__ function from TestComponent :)');
    alert('special __hydrate__ function from TestComponent :)');
  }
}

export { TestComponent }

customElements.define('wcc-test', TestComponent)