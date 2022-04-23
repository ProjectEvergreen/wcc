class TestComponent extends HTMLElement {
  constructor() {
    super()

    // TODO have wcc skip over mode / attachShadow, innerHTML, connectedCallback, etc
    this.attachShadow({ mode: 'open' });
  }

  static __secret() {
    console.debug('sssshhh!  this is a secret :)')
  }
}

export { TestComponent }

customElements.define('wcc-test', TestComponent)