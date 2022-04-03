import './dom-shim.js';

async function renderToString(component) {
  console.debug({ component });
  const c = new component();
  
  c.connectedCallback();

  console.debug({ c });

  return c.shadowRoot.innerHTML;
}

// TODO renderToStream

export {
  renderToString
}