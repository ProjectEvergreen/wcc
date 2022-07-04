class CounterControl extends HTMLElement {   
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
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
    // in this case 2; button -> div -> wcc-counter
    this.innerHTML = `
      <div>
        <button onclick="this.parentElement.parentElement.decrement();"> + </button>
        <span>You have clicked <span id="count">${count}</span> times</span>
        <button id="inc" onclick="this.parentElement.parentElement.increment();"> + </button>
      </div> 
    `;
  }
}

customElements.define('wcc-counter-control', CounterControl);