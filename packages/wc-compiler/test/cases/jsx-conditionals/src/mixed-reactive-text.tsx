/* oxlint-disable no-constant-condition -- Even constant markup must not be erased by a sibling text effect. */
export const inferredObservability = true;

export default class MixedConditionalText extends HTMLElement {
  #value = new Signal.State('Reactive');

  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <section>
        {true ? <p>Conditional</p> : null}
        {this.#value.get()}
      </section>
    );
  }
}

customElements.define('wcc-mixed-conditional-text', MixedConditionalText);
