import './components/counter.js';

const template = document.createElement('template');

template.innerHTML = `
  <h1>Counter</h1>

  <wcc-counter count="5"></wcc-counter>
`;

export default class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <h1>Counter</h1>

    <wcc-counter count="5"></wcc-counter>
  `;
  }
}