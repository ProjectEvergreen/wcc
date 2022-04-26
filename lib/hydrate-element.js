// https://web.dev/declarative-shadow-dom/#hydration
class HydrateElement extends HTMLElement {
  constructor() {
    super();
    console.debug('HydrateElement::constructor');

    if (this.shadowRoot) {
      console.debug('shadowRoot detected!');
    }

    // create a Shadow root
    this.root = this.attachShadow({ mode: 'open' });
  }

  // run some code when the component is ready
  connectedCallback() {
    this.root.innerHTML = 'TODO get from SFP <template';
  }

  render() {
    console.debug('HydrateElement::render');
  }
}

/*
<style>
  x-foo:not(:defined) > * {
    display: none;
  }
</style>
*/

export { HydrateElement };