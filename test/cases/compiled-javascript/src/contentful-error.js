// This combination of an initialized class field and a comma expression after super() is valid JavaScript.
// Passing it through Sucrase inserts the field initializer before the comma, producing syntax that Acorn cannot parse.
export class ContentfulError extends Error {
  name = 'ContentfulError';

  constructor(message, linkType) {
    (super(message), (this.linkType = linkType));
  }
}
