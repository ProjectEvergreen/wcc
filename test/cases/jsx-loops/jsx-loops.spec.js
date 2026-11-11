import { expect } from 'chai';
import fs from 'node:fs';
import { renderFromHTML } from 'wc-compiler';

function normalize(source) {
  return source.replace(/ /g, '').replace(/\n/g, '');
}

function expectOutput(source, fixture) {
  const expected = fs.readFileSync(new URL(`./fixtures/${fixture}.txt`, import.meta.url), 'utf-8');
  expect(normalize(source)).to.contain(normalize(expected));
}

describe('JSX loops compiler output', () => {
  const sources = new Map();

  before(async () => {
    for (const [file, tags] of [
      ['posts.jsx', ['wcc-loop-posts']],
      ['lists.jsx', ['wcc-loop-lists']],
      ['multiple-components.jsx', ['wcc-loop-first', 'wcc-loop-second']],
      ['shadow-dom.jsx', ['wcc-loop-shadow']],
      ['comments.tsx', ['wcc-loop-comments']],
    ]) {
      const { metadata } = await renderFromHTML(tags.map((tag) => `<${tag}></${tag}>`).join(''), [
        new URL(`./src/${file}`, import.meta.url),
      ]);
      sources.set(file, metadata[tags[0]].source);
    }
  });

  it('emits map callbacks, joining, escaping and block returns', () => {
    const source = sources.get('posts.jsx');
    expectOutput(source, 'posts/render');
    expectOutput(source, 'posts/child-normalizer');
    expect(source.match(/static \$\$wccChild\(value\)/g)).to.have.length(1);
  });

  it('emits saved maps, chains, nested maps, flatMap, forEach, helper returns and escaped attributes', () => {
    const source = sources.get('lists.jsx');
    expectOutput(source, 'lists/render');
    expectOutput(source, 'lists/helper');
    expect(source).to.contain("const $$wccMarkup = 'authored name';");
    expect(source.match(/static \$\$wcc_Child\(value\)/g)).to.have.length(1);
    expect(source.match(/function \$\$wcc_Child\(value\)/g)).to.have.length(1);
  });

  it('qualifies child normalizer calls with their owning component class', () => {
    const source = sources.get('multiple-components.jsx');
    expectOutput(source, 'multiple/first');
    expectOutput(source, 'multiple/second');
    expect(source.match(/static \$\$wccChild\(value\)/g)).to.have.length(2);
  });

  it('emits component references at the correct depth inside mapped handlers', () => {
    const source = sources.get('lists.jsx');
    expect(source).to.contain('})(event, this.parentElement.parentElement.parentElement)');
    expect(source).to.contain(
      'onclick="this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.action(event)"',
    );
  });

  it('emits Shadow DOM rendering and mapped host handlers', () => {
    expectOutput(sources.get('shadow-dom.jsx'), 'shadow-dom/render');
  });

  it('emits TSX reply maps alongside visibility effects, cleanup and grouped static methods', () => {
    const source = sources.get('comments.tsx');
    expectOutput(source, 'comments/render');
    expectOutput(source, 'comments/connected-callback');
    expectOutput(source, 'comments/disconnected-callback');

    const actual = normalize(source);
    expect(actual).to.contain('exportdefaultclassCommentsextendsHTMLElement{$el0;$el1;static');

    const parseIndex = actual.indexOf('staticparseAttribute');
    const childIndex = actual.indexOf('static$$wccChild');
    const callbackIndex = actual.indexOf('attributeChangedCallback(');
    expect(parseIndex).to.be.greaterThan(-1);
    expect(childIndex).to.be.greaterThan(parseIndex);
    expect(callbackIndex).to.be.greaterThan(childIndex);
    expect(actual).to.match(/staticparseAttribute=[^;]*;static\$\$wccChild\(value\)/);
  });
});
