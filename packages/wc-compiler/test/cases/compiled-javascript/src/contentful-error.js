// This combination of an initialized class field and a comma expression after super() is valid JavaScript.
// Passing it through Sucrase inserts the field initializer before the comma, producing syntax that Acorn cannot parse.
export class ContentfulError extends Error {
  name = 'ContentfulError';

  // oxlint-disable-next-line constructor-super - The regression fixture calls super() in a comma expression.
  constructor(message, linkType) {
    // oxlint-disable-next-line no-unused-expressions - Preserve the comma expression that reproduces the Sucrase regression.
    (super(message), (this.linkType = linkType));
  }
}
