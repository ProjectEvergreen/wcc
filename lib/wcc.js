import './dom-shim.js';

async function renderToString(component) {
  console.debug({ component });
  const c = new component();

  c.connectedCallback();

  return c.mode === 'closed'
    ? c.shadowRoot.innerHTML
    : `<template shadowroot="open">
        ${c.shadowRoot.innerHTML}
      </template>`;
}

// TODO renderToStream

export {
  renderToString
}