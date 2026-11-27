import { Signal } from 'signal-polyfill';

export const inferredObservability = true;

export default class Markup extends HTMLElement {
  markup;

  constructor() {
    super();
    this.markup = new Signal.State('<strong>Signal markup</strong>');
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { markup } = this;

    return (
      <section>
        <div innerHTML={markup.get()}></div>
      </section>
    );
  }
}

customElements.define('wcc-markup-tsx', Markup);
