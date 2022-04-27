class TestComponent extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' });
  }

  static __hydrate__() {
    console.debug('special __hydrate__ function from TestComponent :)')
  }
}

export { TestComponent }

customElements.define('wcc-test', TestComponent)