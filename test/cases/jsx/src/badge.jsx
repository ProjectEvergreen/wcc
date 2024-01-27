export default class BadgeComponent extends HTMLElement {

  constructor() {
    super();

    this.count = 0;
    this.predicate = false;
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes () {
    return ['count', 'predicate'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue !== oldValue) {
      if (name === 'count') {
        this.count = parseInt(newValue, 10);
      } else if (name === 'predicate') {
        this.predicate = newValue === 'true';
      }

      this.render();
    }
  }

  render() {
    const { count, predicate } = this;
    const conditionalClass = predicate ? 'met' : 'unmet';
    const conditionalText = predicate ? ' 🥳' : '';

    return (
      <span class={conditionalClass}><span>{count}</span>{conditionalText}</span>
    );
  }
}

customElements.define('wcc-badge', BadgeComponent);