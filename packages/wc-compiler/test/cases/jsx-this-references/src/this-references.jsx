export const inferredObservability = true;

export default class ThisReferences extends HTMLElement {
  constructor() {
    super();
    this.count = new Signal.State(2);
    this.parity = new Signal.Computed(() => (this.count.get() % 2 ? 'odd' : 'even'));
    this.total = new Signal.Computed(() => this.todos.length);
    this.todos = ['Write tests', 'Ship'];
    this.user = { id: 'user-1', name: 'Alex' };
    this.predicate = true;
    this.backup = new Signal.State(9);
    this.nullable = null;
    this.fallbackCalls = 0;
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.render();
  }

  deleteUser(id) {
    this.deleted = id;
  }

  getFallback() {
    this.fallbackCalls++;
    return this.backup;
  }

  unexpectedFallback() {
    throw new Error('A defined property must not evaluate its default');
  }

  render() {
    const { count: total, user, predicate } = this;
    const current = this.count;
    const { parity: count } = this;
    const {
      count: defaultCount = this.count,
      missing: fallbackCount = this.getFallback(),
      optional: localCount = current,
      count: lazyCount = this.unexpectedFallback(),
      nullable = this.unexpectedFallback(),
    } = this;
    const conditionClass = predicate ? 'met' : 'unmet';
    const label = `${user.name}: ${conditionClass}`;

    // Literal reads retain their receiver: `{this.todos.length}` and `{this.count.get()}`.
    // Aliases resolve to their instance field in effects: `total.get()` -> `this.count.get()`.
    // Derived locals such as `conditionClass` stay in render(), outside observed attributes.
    return (
      <>
        <section>
          <h2 title={this.todos.length}>You have {this.todos.length} TODOs left</h2>
          <p data-count={this.count.get()}>
            The count is {this.count.get()} / {this.count.get()}
          </p>
          <span class={this.parity.get()}>{this.parity.get()}</span>
          <h3 class={conditionClass} title={label}>
            {user.name}
          </h3>
          <p data-count={total.get()}>Total: {total.get()}</p>
          <span title={current.get()}>Current: {current.get()}</span>
          <button onclick={() => this.deleteUser(user.id)}>Delete {user.name}</button>
        </section>
        <p title={this.total.get()}>Tasks: {this.total.get()}</p>
        {/* Repeated reads and colliding names need independent template parameters. */}
        <p id="repeated">
          {this.count.get()} / {this.count.get()}
        </p>
        <p id="collision">
          {count.get()} / {this.count.get()}
        </p>
        {/* Defaults select their signal once in render scope, including local fallbacks. */}
        <p id="defaults" title={fallbackCount.get()}>
          {defaultCount.get()} / {fallbackCount.get()} / {localCount.get()} / {lazyCount.get()}
        </p>
        <p id="nullable">{nullable === null ? 'null preserved' : 'unexpected default'}</p>
      </>
    );
  }
}

customElements.define('wcc-this-references', ThisReferences);
