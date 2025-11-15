export default class BadgeComponent extends HTMLElement {
  count;
  predicate;

  constructor() {
    super();

    this.count = 0;
    this.predicate = false;
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['count', 'predicate'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
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
      <span class={conditionalClass}>
        {count}
        {conditionalText}
      </span>
    );
  }
}

customElements.define('wcc-badge', BadgeComponent);

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wcc-badge': {
        count?: number;
      };
    }
  }
}
