import './components/prop-passer.js';
import './components/prop-receiver.js';

export default class ElementProps extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<prop-passer></prop-passer>';
  }
}

customElements.define('element-props', ElementProps);
