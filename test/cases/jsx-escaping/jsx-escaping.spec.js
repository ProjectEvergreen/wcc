import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderFromHTML } from 'wc-compiler';

describe('JSX HTML escaping', () => {
  for (const [attribute, text] of [
    ['<template>', '<template>'],
    ['&lt;template&gt;', '<template>'],
    ['&quot;&lt;template&gt;&quot; &amp; text', '"<template>" & text'],
    ['&amp;lt;template&amp;gt;', '&lt;template&gt;'],
    ['&lt;/h4&gt;&lt;strong&gt;text&lt;/strong&gt;', '</h4><strong>text</strong>'],
  ]) {
    // <wcc-escaping heading="&lt;template&gt;">...</wcc-escaping>
    // const heading = this.getAttribute('heading');
    // <h4 title={heading}>{heading}</h4>
    it(`should preserve attribute-derived text: ${attribute}`, async () => {
      const { html } = await renderFromHTML(
        `<wcc-escaping heading="${attribute}"><p>Original content</p></wcc-escaping>`,
        [new URL('./src/escaping.jsx', import.meta.url)],
      );
      const document = new JSDOM(html).window.document;
      const heading = document.querySelector('h4');

      expect(heading.textContent).to.equal(text);
      expect(heading.getAttribute('title')).to.equal(text);
      expect(heading.attributes.length).to.equal(1);
      expect(heading.childElementCount).to.equal(0);
      expect(document.querySelector('textarea').textContent).to.equal(text);
      expect(document.querySelector('#content > p').textContent).to.equal('Original content');
      expect(document.querySelector('template')).to.equal(null);
    });
  }

  // const values = { text: '&lt;template&gt; "quoted" & <strong>text</strong>' };
  // <p title={values.text}>{values.text}</p>
  // <p title='"Hello" &amp; &amp;lt;'>{'<template> &lt;template&gt;'}</p>
  // <p title={'"Hello" &lt;template&gt;'} data-number={0x10}>{42}</p>
  it('should escape member expressions and decode source literals exactly once', async () => {
    const { html } = await renderFromHTML('<wcc-escaping></wcc-escaping>', [
      new URL('./src/escaping.jsx', import.meta.url),
    ]);
    const document = new JSDOM(html).window.document;
    const member = document.querySelector('#member');

    expect(member.textContent.trim()).to.equal('&lt;template&gt; "quoted" & <strong>text</strong>');
    expect(member.getAttribute('title')).to.equal(member.textContent.trim());
    expect(member.childElementCount).to.equal(0);
    expect(document.querySelector('#literal').textContent.trim()).to.equal(
      '<template> &lt;template&gt;',
    );
    expect(document.querySelector('#literal').getAttribute('title')).to.equal('"Hello" & &lt;');
    expect(document.querySelector('#literal').attributes.length).to.equal(2);
    expect(document.querySelector('#expression-literal').getAttribute('title')).to.equal(
      '"Hello" &lt;template&gt;',
    );
    expect(document.querySelector('#expression-literal').getAttribute('data-number')).to.equal(
      '16',
    );
    expect(document.querySelector('#expression-literal').textContent.trim()).to.equal('42');
  });

  // const markup = '<strong>Intentional HTML</strong>';
  // const css = 'p > span { color: red; }';
  // const script = 'const comparison = 1 < 2 && 3 > 2;';
  // <div innerHTML={markup}></div>
  // <div innerHTML="&lt;strong&gt;Literal HTML&lt;/strong&gt;"></div>
  // <style>{css}</style>
  // <script>{script}</script>
  it('should insert explicit HTML and preserve style and script contents', async () => {
    const { html } = await renderFromHTML('<wcc-escaping></wcc-escaping>', [
      new URL('./src/escaping.jsx', import.meta.url),
    ]);
    const document = new JSDOM(html).window.document;

    expect(document.querySelector('#markup > strong').textContent).to.equal('Intentional HTML');
    expect(document.querySelector('#literal-markup > strong').textContent).to.equal('Literal HTML');
    expect(document.querySelector('[innerhtml]')).to.equal(null);
    expect(document.querySelector('style').textContent).to.equal('p > span { color: red; }');
    expect(document.querySelector('script').textContent).to.equal(
      'const comparison = 1 < 2 && 3 > 2;',
    );
  });

  // const label = new Signal.State('"<template>" & &lt;');
  // const markup = new Signal.State('<strong>Initial HTML</strong>');
  // <section title={label.get()}>
  //   <p title={label.get()}>Label &amp; &dollar; value: {label.get()}</p>
  //   <div innerHTML={markup.get()}></div>
  // </section>
  it('should preserve signal values and emit text, attribute, and HTML updates', async () => {
    const { html, metadata } = await renderFromHTML(
      '<wcc-reactive-escaping></wcc-reactive-escaping>',
      [new URL('./src/reactive.jsx', import.meta.url)],
    );
    const document = new JSDOM(html).window.document;
    const paragraph = document.querySelector('wcc-reactive-escaping p');

    expect(paragraph.textContent).to.equal('Label & $ value: "<template>" & &lt;');
    expect(paragraph.getAttribute('title')).to.equal('"<template>" & &lt;');
    expect(paragraph.childElementCount).to.equal(0);
    expect(document.querySelector('wcc-reactive-escaping div > strong').textContent).to.equal(
      'Initial HTML',
    );
    expect(document.querySelector('wcc-reactive-escaping section').getAttribute('title')).to.equal(
      '"<template>" & &lt;',
    );
    expect(document.querySelector('[innerhtml]')).to.equal(null);

    const source = metadata['wcc-reactive-escaping'].source;
    expect(source).to.contain(
      'this.$el0.textContent = ReactiveEscaping.$$tmpl0(this.label.get());',
    );
    expect(source).to.contain("this.$el0.setAttribute('title', this.label.get());");
    expect(source).to.contain('this.$el1.innerHTML = this.markup.get();');
    expect(source).to.contain("this.$el2 = this.querySelector('section:nth-of-type(1)');");
    expect(source).to.contain("this.$el2.setAttribute('title', this.label.get());");
  });
});
