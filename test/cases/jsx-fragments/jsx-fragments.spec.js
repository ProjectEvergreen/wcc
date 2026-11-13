/*
 * Use Case
 * Compile JSX and TSX fragments, including signals and Declarative Shadow DOM.
 *
 * User Result
 * Fragments preserve their children without adding HTML wrappers, DOM depth,
 * or selector levels to the generated HTML and JavaScript.
 */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { renderToString } from 'wc-compiler';

describe('JSX and TSX fragments', function () {
  for (const extension of ['jsx', 'tsx']) {
    describe(extension.toUpperCase(), function () {
      let component;
      let source;

      before(async function () {
        const tag = `wcc-fragments-${extension}`;
        const { html, metadata } = await renderToString(
          new URL(`./src/signals-counter.${extension}`, import.meta.url),
        );

        component = new JSDOM(html).window.document.querySelector(tag);
        source = metadata[tag].source.replace(/\s+/g, '');
      });

      it('should emit root and nested fragment children in order without wrappers', () => {
        expect(Array.from(component.children, (child) => child.tagName)).to.deep.equal([
          'DIV',
          'P',
          'BUTTON',
          'P',
        ]);
        expect(
          Array.from(component.firstElementChild.children, (child) => child.tagName),
        ).to.deep.equal(['BUTTON', 'SPAN', 'SPAN']);
      });

      it('should preserve and escape text expressions in nested fragments', () => {
        const text = component.querySelector('#fragment-text');

        expect(text.textContent.replace(/\s+/g, ' ').trim()).to.equal('Value: <safe> & sound');
        expect(text.children).to.have.length(0);
        expect(text.innerHTML).to.contain('&lt;safe&gt; &amp; sound');
      });

      it('should emit event references at the actual DOM depth', () => {
        expect(component.querySelector('#nested').getAttribute('onclick')).to.equal(
          'this.parentElement.parentElement.increment(event)',
        );
        expect(
          component.querySelector('#root').getAttribute('onclick').replace(/\s+/g, ''),
        ).to.equal('(function(event,self){self.increment();})(event,this.parentElement)');
      });

      it('should preserve reactive values and selectors across fragment boundaries', () => {
        for (const id of ['child-reactive', 'root-reactive']) {
          const element = component.querySelector(`#${id}`);

          expect(element.textContent.replace(/\s+/g, ' ').trim()).to.equal('Count: 0');
          expect(element.getAttribute('data-count')).to.equal('0');
        }
        expect(source).to.contain(
          "this.$el0=this.querySelector('div:nth-of-type(1)>span:nth-of-type(2)')",
        );
        expect(source).to.contain("this.$el1=this.querySelector('p:nth-of-type(2)')");
        expect(source).to.contain('this.$el0.textContent=Fragments.$$tmpl0(this.count.get())');
        expect(source).to.contain('this.$el1.textContent=Fragments.$$tmpl1(this.count.get())');
        expect(source).to.contain("this.$el0.setAttribute('data-count',this.count.get())");
        expect(source).to.contain("this.$el1.setAttribute('data-count',this.count.get())");
      });
    });
  }

  it('should preserve fragment siblings and host event references in Shadow DOM', async () => {
    const { html } = await renderToString(new URL('./src/shadow.jsx', import.meta.url));
    const template = new JSDOM(html).window.document.querySelector(
      'wcc-shadow-fragments template[shadowrootmode="open"]',
    );

    expect(Array.from(template.content.children, (child) => child.tagName)).to.deep.equal([
      'H1',
      'BUTTON',
      'BUTTON',
    ]);
    expect(template.content.querySelector('#reference').getAttribute('onclick')).to.equal(
      'this.getRootNode().host.greet(event)',
    );
    expect(
      template.content.querySelector('#inline').getAttribute('onclick').replace(/\s+/g, ''),
    ).to.equal('(function(event,self){self.greet();})(event,this.getRootNode().host)');
  });

  it('should emit empty HTML for an empty root fragment', async () => {
    const { html, metadata } = await renderToString(new URL('./src/empty.tsx', import.meta.url));

    expect(html.replace(/>\s+</g, '><').trim()).to.equal(
      '<wcc-empty-fragments></wcc-empty-fragments>',
    );
    expect(metadata['wcc-empty-fragments'].source.replace(/\s+/g, '')).to.contain(
      'this.innerHTML=``;',
    );
  });
});
