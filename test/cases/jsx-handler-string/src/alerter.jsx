export default class Alerter extends HTMLElement {
  greet(message) {
    alert(message);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <div>
        <button id="evt-string" onclick={() => alert("this rocks, click this button")}>
          Alert
        </button>
        <button id="evt-mixed" onclick={() => this.greet("this is a message")}>
          Greet
        </button>
      </div>
    );
  }
}

customElements.define('wcc-alerter', Alerter);
