import styles from './capability-box.module.css';

export default class CapabilityBox extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const heading = this.getAttribute('heading') ?? '';
    const { innerHTML } = this;

    return (
      <div class={styles.container}>
        <h4 class={styles.heading}>{heading}</h4>
        {innerHTML}
      </div>
    );
  }
}

customElements.define('wcc-capability-box', CapabilityBox);
