class Counter extends HTMLElement {
  constructor(props = {}) {
    super();

    console.debug('Counter constructor + SHADOW ROOT', this.shadowRoot);

    this.count = props.count || 0;

    if(this.shadowRoot) {
      console.debug('Counter => shadowRoot detected!')
      this.hydrate();
    }

    console.debug('=====================');
  }

  connectedCallback() {
    if(!this.shadowRoot) {
      console.debug('Counter => shadowRoot NOT detected', this.props)
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = this.render();
    }
  }

  inc() {
    this.count = this.count + 1;
    this.update();
  }

  dec() {
    this.count = this.count - 1;
    this.update();
  }

  hydrate() {
    console.debug('COUNTER => hydrate');
    this.count = parseInt(JSON.parse(this.shadowRoot.querySelector('script[type="application/json"').text).count);
    console.debug('restore count', this.count)

    const buttonDec = this.shadowRoot.querySelector('button#dec');
    const buttonInc = this.shadowRoot.querySelector('button#inc');

    buttonDec.addEventListener('click', this.dec.bind(this));
    buttonInc.addEventListener('click', this.inc.bind(this));
  }

  update() {
    this.shadowRoot.querySelector('span#count').textContent = this.count;
  }

  render() {
    return `
      <script type="application/json">
        ${JSON.stringify({ count: this.count })}
      </script>

      <div>
        <button id="inc">Increment</button>
        <span>Current Count: <span id="count">${this.count}</span></span>
        <button id="dec">Decrement</button>
      </div>
    `;
  }
}

export {
  Counter
}

export async function getData() {
  return {
    count: Math.floor(Math.random() * (100 - 0 + 1) + 0)
  }
}

customElements.define('wcc-counter', Counter);