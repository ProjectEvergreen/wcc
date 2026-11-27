import { Signal } from 'signal-polyfill';

export const inferredObservability = true;

export default class ReactiveEscaping extends HTMLElement {
  constructor() {
    super();
    this.label = new Signal.State('"<template>" & &lt;');
    this.markup = new Signal.State('<strong>Initial HTML</strong>');
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const { label, markup } = this;

    return (
      <section title={label.get()}>
        <p title={label.get()}>Label &amp; &dollar; value: {label.get()}</p>
        <div innerHTML={markup.get()}></div>
      </section>
    );
  }
}

customElements.define('wcc-reactive-escaping', ReactiveEscaping);
