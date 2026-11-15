import styles from './styles.module.css';

export default class NonReactiveAttributes extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <section class={styles.container}>
        <p class={styles.label}>CSS Modules</p>
      </section>
    );
  }
}

customElements.define('wcc-non-reactive-attributes', NonReactiveAttributes);
