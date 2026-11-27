export default class Escaping extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const heading = this.getAttribute('heading') ?? '';
    const { innerHTML } = this;
    const values = { text: '&lt;template&gt; "quoted" & <strong>text</strong>' };
    const markup = '<strong>Intentional HTML</strong>';
    const css = 'p > span { color: red; }';
    const script = 'const comparison = 1 < 2 && 3 > 2;';

    return (
      <section>
        <h4 title={heading}>{heading}</h4>
        <p id="member" title={values.text}>
          {values.text}
        </p>
        <p id="literal" title='"Hello" &amp; &amp;lt;'>
          {'<template> &lt;template&gt;'}
        </p>
        <p id="expression-literal" title={'"Hello" &lt;template&gt;'} data-number={0x10}>
          {42}
        </p>
        <div id="content" innerHTML={innerHTML}></div>
        <div id="markup" innerHTML={markup}></div>
        <div id="literal-markup" innerHTML="&lt;strong&gt;Literal HTML&lt;/strong&gt;"></div>
        <textarea>{heading}</textarea>
        <style>{css}</style>
        <script>{script}</script>
      </section>
    );
  }
}

customElements.define('wcc-escaping', Escaping);
