import './components/open-shadow-component.js';
import './components/closed-shadow-component.js';

export default class ShadowRootModeContainer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <open-shadow-component></open-shadow-component>
      <closed-shadow-component></closed-shadow-component>
    `;
  }
}

customElements.define('shadowrootmode-container', ShadowRootModeContainer);