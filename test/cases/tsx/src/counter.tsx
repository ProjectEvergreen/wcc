import './badge.tsx';

export default class Counter extends HTMLElement {
  count;

  constructor() {
    super();
    this.count = 0;
  }

  increment() {
    this.count += 1;
    this.render();
  }

  decrement() {
    this.count -= 1;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { count } = this;

    return (
      <div>
        <wcc-badge count={count}></wcc-badge>
        <h3 data-test="hello123">Counter JSX</h3>

        <button id="evt-this" onclick={this.decrement}>
          {' '}
          - (function reference)
        </button>
        {/* @ts-expect-error - onclick should be a function, but we coerce to an assignment */}
        <button id="evt-assignment" onclick={(this.count -= 1)}>{' '} - (inline state update)</button>
        <button
          id="evt-inline"
          onclick={(e: Event) => {
            console.log({ e });
          }}
        >
          Click Me
        </button>
        {/* @ts-expect-error - onclick should be a function, but we coerce to an assignment */}
        <button id="evt-assignment" onclick={(this.count -= 1)}>{' '} - (inline state update)</button>
        <span>
          You have clicked{' '}
          <span class="red" id="expression">
            {count}
          </span>{' '}
          times
        </span>
        {/* @ts-expect-error - onclick should be a function, but we coerce to an assignment */}
        <button onclick={(this.count += 1)}> + (inline state update)</button>
        {/* test for https://github.com/ProjectEvergreen/wcc/issues/277 */}
        <button onclick={this.increment} tabindex={-1}> + (function reference)</button>
        {/* test for https://github.com/ProjectEvergreen/wcc/issues/277 */}
        <svg
          class="svg-inline--fa fa-share-alt fa-w-14"
          aria-hidden="true"
          data-prefix="fas"
          data-icon="share-alt"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          data-fa-i2svg=""
        >
          <path
            fill="currentColor"
            d="M352 320c-22.608 0-43.387 7.819-59.79 20.895l-102.486-64.054a96.551 96.551 0 0 0 0-41.683l102.486-64.054C308.613 184.181 329.392 192 352 192c53.019 0 96-42.981 96-96S405.019 0 352 0s-96 42.981-96 96c0 7.158.79 14.13 2.276 20.841L155.79 180.895C139.387 167.819 118.608 160 96 160c-53.019 0-96 42.981-96 96s42.981 96 96 96c22.608 0 43.387-7.819 59.79-20.895l102.486 64.054A96.301 96.301 0 0 0 256 416c0 53.019 42.981 96 96 96s96-42.981 96-96-42.981-96-96-96z"
          ></path>
        </svg>
      </div>
    );
  }
}

customElements.define('wcc-counter-jsx', Counter);
