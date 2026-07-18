/*
 * Use Case
 * Run wcc against a custom element authored in the "declare class, customElements.define, then
 * `export default Identifier`" form (as opposed to `export default class Name ...`) with
 * inferredObservability enabled and a signal driving a connectedCallback effect.
 *
 * User Result
 * The compiled source should reference the real class name (never `undefined`) in the injected
 * effect wiring, and the static template / observedAttributes it depends on should be injected too,
 * so the element does not throw `Cannot read properties of undefined (reading '$$tmpl0')` on connect.
 *
 * User Workspace
 * src/
 *   counter.jsx   // class Counter extends HTMLElement {}; customElements.define(...); export default Counter;
 */
import { expect } from 'chai';
import { renderToString } from '../../../src/wcc.js';

describe('Run WCC For ', function () {
  const LABEL = 'Custom Element using JSX, Inferred Observability and `export default Identifier`';

  describe(LABEL, function () {
    let source;

    before(async function () {
      const { metadata } = await renderToString(new URL('./src/counter.jsx', import.meta.url));

      source = metadata['wcc-anon-counter'].source;
    });

    // the bug: effect wiring is appended unconditionally as `${componentName}.$$tmpl0(...)`, and for
    // this export form `componentName` was `undefined` -> `undefined.$$tmpl0(...)` (throws on connect)
    it('should not reference `undefined` in the injected effect expression', () => {
      expect(source.indexOf('undefined.$$tmpl0')).to.equal(-1);
    });

    it('should reference the real class name in the injected effect expression', () => {
      expect(source.indexOf('Counter.$$tmpl0(this.count.get())')).to.be.greaterThan(-1);
    });

    it('should inject the static template the effect depends on (real class name)', () => {
      const actual = source.replace(/ /g, '').replace(/\n/g, '');

      expect(actual.indexOf('static$$tmpl0=count=>`Count:${count}`')).to.be.greaterThan(-1);
    });

    it('should inject a get observedAttributes method for the tracked signal', () => {
      const actual = source.replace(/ /g, '').replace(/\n/g, '');

      expect(actual.indexOf("staticgetobservedAttributes(){return['count'];}")).to.be.greaterThan(
        -1,
      );
    });

    it('should inject an attributeChangedCallback that parses via the real class name', () => {
      const actual = source.replace(/ /g, '').replace(/\n/g, '');

      expect(actual.indexOf('this[name].set(Counter.parseAttribute(newValue));')).to.be.greaterThan(
        -1,
      );
    });

    // internal consistency: every `<name>.$$tmpl0` call resolves to an injected `static $$tmpl0`
    it('should be internally consistent (every $$tmpl0 caller has a matching static definition)', () => {
      const callers = [...source.matchAll(/(\w+)\.\$\$tmpl0\(/g)].map((m) => m[1]);

      expect(callers.length).to.be.greaterThan(0);

      for (const name of callers) {
        expect(name).to.not.equal('undefined');
        expect(source.indexOf('static $$tmpl0 =')).to.be.greaterThan(-1);
      }
    });
  });
});
