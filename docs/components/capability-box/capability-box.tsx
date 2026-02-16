import styles from './capability-box.module.css';

export default class CapabilityBox extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const heading = this.getAttribute('heading') ?? '';
    const content = this.innerHTML;

    this.innerHTML = '';

    const container = document.createElement('div');
    container.className = styles.container;

    const span = document.createElement('span');
    span.className = styles.heading;

    span.textContent = heading;

    container.appendChild(span);

    const contentWrapper = document.createElement('div');
    contentWrapper.innerHTML = content;

    container.appendChild(contentWrapper);

    this.appendChild(container);
  }
}

customElements.define('wcc-capability-box', CapabilityBox);
