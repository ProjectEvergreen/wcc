/*
 * Use Case
 * Run wcc against custom elements with declarative shadow dom and get the asset graph.
 *
 * User Result
 * Should return the expected asset graph and entries.
 *
 * User Workspace
 * src/
 *   components/
 *     footer.js
 *     header.js
 *     navigation.js
 *   pages/
 *     index.js
 */

import chai from 'chai';
import { renderToString } from '../../../src/wcc.js';

const expect = chai.expect;

describe('Run WCC For ', function() {
  const LABEL = 'Assets graph and metadata';
  let assetMetadata;

  before(async function() {
    const { assets } = await renderToString(new URL('./src/pages/index.js', import.meta.url));
    
    assetMetadata = assets;
  });

  describe(LABEL, function() {
    it('should have three custom elements in the asset graph', function() {
      expect(Object.keys(assetMetadata).length).to.equal(3);
    });

    it('should return the footer module with a hydrate hint', function() {
      const hydrateScripts = Object.entries(assetMetadata)
        .filter(asset => asset[1].hydrate === 'lazy');

      expect(hydrateScripts[0][0]).to.equal('wcc-footer');
    });

    it('should have the correct attributes for each asset', function() {
      Object.entries(assetMetadata).forEach((asset) => {
        expect(asset[0]).to.not.be.undefined;
        expect(asset[1].instanceName).to.not.be.undefined;
        expect(asset[1].moduleURL).to.not.be.undefined;
      })
    });
  });
});