import { Signal } from 'signal-polyfill';

export const inferredObservability = true;

export default class ReactiveAttributes extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(0);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const styles = {
      container: this.getAttribute('container-class') ?? 'container',
      label: this.getAttribute('label-class') ?? 'label',
    };
    const { count } = this;

    return (
      <section class={styles.container}>
        <p class={styles.label} data-count={count.get()}>
          Count: {count.get()}
        </p>
      </section>
    );
  }
}

customElements.define('wcc-reactive-attributes', ReactiveAttributes);
