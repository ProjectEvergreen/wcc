class CounterControl extends HTMLElement {   
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    // manual event handlers
    // const buttonDec = this.shadowRoot.querySelector('button#dec');
    // const buttonInc = this.shadowRoot.querySelector('button#inc');

    // buttonDec.addEventListener('click', this.decrement.bind(this));
    // buttonInc.addEventListener('click', this.increment.bind(this));

    this.render();
  }

  increment() {
    this.count += 1;
    this.render();
  }

  decrement() {
    this.count -= 1;
    this.render();
  }

  // TODO ideally a patch over a full re-render would be ideal
  // update() {
  //   this.querySelector('span#count').textContent = this.count;
  // }

  render() {
    const { count } = this;
  
    // parentElement can be reverse engineered by walking up from this to wcc-counter
    // in this case 2; button -> div (parentElement) -> wcc-counter (parentElement)
    this.innerHTML = `
      <div>
        <h3>CounterControl</h3>
        <button id="dec" onclick="this.parentElement.parentElement.decrement();"> - </button>
        <span>You have clicked <span id="count">${count}</span> times</span>
        <button id="inc" onclick="this.parentElement.parentElement.increment();"> + </button>
      </div> 
    `;
  }
}

customElements.define('wcc-counter-control', CounterControl);

class CounterControlShadow extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    this.render();
  }

  increment() {
    this.count += 1;
    this.render();
  }

  decrement() {
    this.count -= 1;
    this.render();
  }

  render() {
    const { count } = this;

    // parentElement can be reverse engineered by walking up from this to wcc-counter
    // but with a shadow root, the custom element becomes a parentNode and so will have no parentElement
    // in this case 2; button -> div (parentElement) -> wcc-counter (parentNode)
    this.shadowRoot.innerHTML = `
      <div>
        <h3>CounterControlShadow</h3>
        <button id="dec" onclick="this.parentElement.parentNode.host.decrement()"> - </button>
        <span>You have clicked <span id="count">${count}</span> times</span>
        <button id="inc" onclick="this.parentElement.parentNode.host.increment();"> + </button>
      </div>
    `;
  }
}

customElements.define('wcc-counter-control-shadow', CounterControlShadow);