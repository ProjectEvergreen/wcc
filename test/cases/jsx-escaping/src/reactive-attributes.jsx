import { Signal } from 'signal-polyfill';
import styles from './styles.module.css';

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
