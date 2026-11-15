export default class NonReactiveAttributes extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const styles = {
      container: this.getAttribute('container-class') ?? 'container',
      label: this.getAttribute('label-class') ?? 'label',
    };
    return (
      <section class={styles.container}>
        <p class={styles.label}>Attribute expressions</p>
      </section>
    );
  }
}

customElements.define('wcc-non-reactive-attributes', NonReactiveAttributes);
