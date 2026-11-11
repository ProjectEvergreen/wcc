import { Parser } from 'acorn';
import * as acornWalk from 'acorn-walk';
import { defaultTreeAdapter, html, parse, parseFragment, serialize } from 'parse5';
import type * as E from 'estree-jsx';
import type { DefaultTreeAdapterTypes as H, Token } from 'parse5';

type Visitors = {
  [K in E.Node['type']]?: (node: Extract<E.Node, { type: K }>) => void;
};
type WalkerBase = typeof acornWalk.base & { JSXElement?: () => void };

// Only the node/visitor assertions adapt generated ESTree nodes to Acorn's types.
export const baseWalker = acornWalk.base;

export function walkSimple(
  node: E.Node,
  visitors: Visitors,
  walker: WalkerBase = baseWalker,
): void {
  acornWalk.simple(
    node as unknown as import('acorn').Node,
    visitors as unknown as acornWalk.SimpleVisitors<undefined>,
    walker,
  );
}

export function parseModule(
  contents: string,
  parser = Parser,
): E.Program & { start: number; end: number } {
  // The JSX parser extends Acorn's runtime grammar, but not its bundled types.
  return parser.parse(contents, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  }) as unknown as E.Program & { start: number; end: number };
}

export interface TemplateLiteralParts {
  text(value: string): void;
  expression(node: E.Expression): void;
  build(trim?: boolean): E.TemplateLiteral;
}

export interface HtmlTemplateLiteralBuilder {
  expression(node: E.Expression, context?: 'text' | 'attribute' | 'raw'): string;
  handler(name: string, expression: E.Expression): string | undefined;
  listeners(hasShadowRoot: boolean): E.Statement[];
  build(tree: H.ParentNode): E.TemplateLiteral;
}

export interface ReactiveSignal {
  // Keep the template parameter separate from its read, e.g. `count` and `this.#count.get()`.
  name: string;
  expression?: E.Expression;
}

export interface ReactiveTemplate {
  template: E.PropertyDefinition;
  expression: E.CallExpression;
}

export interface ReactiveElement {
  selector: string;
  effect?: ReactiveTemplate;
  attributes: Array<{ name: string; value: string; expression?: E.Expression }>;
}

// HTML elements whose children are omitted by the serializer, including obsolete void tags.
// TODO: we should figure out how to properly handle void elements in SSR, e.g. `<img src="..." />` should not be `<img src="..."></img>`.
const voidElements = new Set([
  'area',
  'base',
  'basefont',
  'bgsound',
  'br',
  'col',
  'embed',
  'frame',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export function isVoidHtmlElement(tagName: string): boolean {
  return voidElements.has(tagName);
}

// Reference a variable or property name, e.g. `count`.
export const createIdentifier = (name: string): E.Identifier => ({ type: 'Identifier', name });

// Reference the current instance: `this`.
const createThisExpression = (): E.ThisExpression => ({ type: 'ThisExpression' });

// Embed a primitive value, e.g. `'template'`, `42`, or `true`.
const createLiteral = (value: string | number | boolean | null): E.SimpleLiteral => ({
  type: 'Literal',
  value,
  // Print string literals with single quotes.
  raw:
    typeof value === 'string'
      ? `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`
      : JSON.stringify(value),
});

// Access a property, e.g. `this.count` or `this[name]` when computed is true.
export const createMemberExpression = (
  object: E.Expression | E.Super,
  property: string | E.Expression | E.PrivateIdentifier,
  computed = false,
): E.MemberExpression => ({
  type: 'MemberExpression',
  object,
  property: typeof property === 'string' ? createIdentifier(property) : property,
  computed,
  optional: false,
});

// Invoke a function or method, e.g. `count.get()`.
export const createCallExpression = (
  callee: E.Expression | E.Super,
  args: Array<E.Expression | E.SpreadElement> = [],
): E.SimpleCallExpression => ({
  type: 'CallExpression',
  callee,
  arguments: args,
  optional: false,
});

// Turn an expression into a statement, e.g. `this.render();`.
const createExpressionStatement = (expression: E.Expression): E.ExpressionStatement => ({
  type: 'ExpressionStatement',
  expression,
});

// Assign or update a value, e.g. `this.count = 0` or `this.count += 1`.
const createAssignmentExpression = (
  left: E.Pattern,
  right: E.Expression,
  operator: E.AssignmentOperator = '=',
): E.AssignmentExpression => ({
  type: 'AssignmentExpression',
  operator,
  left,
  right,
});

// Group statements in braces, e.g. `{ this.render(); }`.
const createBlockStatement = (body: E.Statement[]): E.BlockStatement => ({
  type: 'BlockStatement',
  body,
});

// Create an arrow function with an expression or block body, e.g. `value => value`.
const createArrowFunctionExpression = (
  params: string[],
  body: E.Expression | E.BlockStatement,
): E.ArrowFunctionExpression => ({
  type: 'ArrowFunctionExpression',
  params: params.map((param) => createIdentifier(param)),
  body,
  expression: body.type !== 'BlockStatement',
  async: false,
});

// Declare a class field, e.g. `$el0;` or `static count = 0;`.
const createPropertyDefinition = (
  name: string,
  value: E.Expression | null = null,
  isStatic = false,
): E.PropertyDefinition => ({
  type: 'PropertyDefinition',
  key: createIdentifier(name),
  value,
  computed: false,
  static: isStatic,
});

// Declare a class method or getter, e.g. `render() {}` or `static get observedAttributes() {}`.
const createMethodDefinition = (
  name: string,
  params: string[],
  body: E.Statement[],
  kind: E.MethodDefinition['kind'] = 'method',
  isStatic = false,
): E.MethodDefinition => ({
  type: 'MethodDefinition',
  key: createIdentifier(name),
  kind,
  computed: false,
  static: isStatic,
  value: {
    type: 'FunctionExpression',
    id: null,
    params: params.map((param) => createIdentifier(param)),
    body: createBlockStatement(body),
    generator: false,
    async: false,
  },
});

// Combine operands with a binary or logical operator, e.g. `count + 1` or `a && b`.
const createBinaryExpression = (
  operator: E.BinaryOperator | E.LogicalOperator,
  left: E.Expression,
  right: E.Expression,
): E.BinaryExpression | E.LogicalExpression => {
  if (operator === '||' || operator === '&&' || operator === '??') {
    return { type: 'LogicalExpression', operator, left, right };
  }
  return { type: 'BinaryExpression', operator, left, right };
};

// Apply a prefix operator, e.g. `!this.shadowRoot` or `+value`.
const createUnaryExpression = (
  operator: E.UnaryOperator,
  argument: E.Expression,
): E.UnaryExpression => ({
  type: 'UnaryExpression',
  operator,
  argument,
  prefix: true,
});

// Choose between expressions, e.g. `ready ? 'yes' : 'no'`.
const createConditionalExpression = (
  test: E.Expression,
  consequent: E.Expression,
  alternate: E.Expression,
): E.ConditionalExpression => ({
  type: 'ConditionalExpression',
  test,
  consequent,
  alternate,
});

// Build a template literal from static strings and expression nodes, e.g. `Hello ${name}!`.
function createTemplateLiteral(strings: string[], expressions: E.Expression[]): E.TemplateLiteral {
  return {
    type: 'TemplateLiteral',
    expressions,
    quasis: strings.map((value, index) => ({
      type: 'TemplateElement',
      value: {
        raw: value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${'),
        cooked: value,
      },
      tail: index === strings.length - 1,
    })),
  };
}

// Collect template text and expressions incrementally, e.g. `Hello `, `${name}`, then `!`.
export function createTemplateLiteralParts(): TemplateLiteralParts {
  const strings = [''];
  const expressions: E.Expression[] = [];
  return {
    // Append static text to the current segment, e.g. `Hello `.
    text(value) {
      strings[strings.length - 1] += value;
    },
    // Add an interpolation and start the next text segment, e.g. `${name}`.
    expression(node) {
      expressions.push(node);
      strings.push('');
    },
    // Finish the template, optionally trimming its outer static whitespace.
    build(trim = false) {
      const text = [...strings];
      if (trim) {
        text[0] = text[0].trimStart();
        text[text.length - 1] = text[text.length - 1].trimEnd();
      }
      return createTemplateLiteral(text, expressions);
    },
  };
}

// Create a container for HTML nodes, e.g. the root of `<p>{count}</p>`.
export function createHtmlFragment(): H.DocumentFragment {
  return defaultTreeAdapter.createDocumentFragment();
}

// Create an HTML element with attributes, e.g. `<button disabled>`.
export function createHtmlElement(tagName: string, attributes: Token.Attribute[] = []): H.Element {
  const element = defaultTreeAdapter.createElement(tagName.toLowerCase(), html.NS.HTML, attributes);
  if (element.tagName === 'template') {
    defaultTreeAdapter.setTemplateContent(element as H.Template, createHtmlFragment());
  }
  return element;
}

// Decode source text into a text node, e.g. `&dollar;` becomes `$` outside raw-text elements.
export function createHtmlTextNode(value: string, parentTagName?: string): H.TextNode {
  if (!html.hasUnescapedText(parentTagName ?? '', true) && value.includes('&')) {
    const fragment = parseFragment(value);
    value = fragment.childNodes.map((node) => ('value' in node ? node.value : '')).join('');
  }
  return defaultTreeAdapter.createTextNode(value);
}

// Create attribute data for a boolean attribute or placeholder, e.g. `disabled` or `title={name}`.
export function createHtmlAttribute(name: string, value = ''): Token.Attribute {
  return { name, value };
}

// Decode quoted JSX source in attribute context; JavaScript expression literals already hold their values.
export function createHtmlLiteralAttributes(
  name: string,
  literal: E.Literal,
  isJsxAttribute = false,
): Token.Attribute[] {
  if (isJsxAttribute) {
    // Acorn's JSX entity table is incomplete (e.g. &dollar;). Parse the original quoted source
    // so parse5 decodes all HTML entities once, without mistaking decoded quotes for delimiters.
    const fragment = parseFragment(`<span ${name}=${literal.raw}></span>`);
    const node = fragment.childNodes[0];
    return 'attrs' in node ? node.attrs : [];
  }
  return [createHtmlAttribute(name, String(literal.value))];
}

// Coerce once, then escape values before they reach innerHTML; DOM setters do not need this step.
function createEscapedHtmlExpression(
  node: E.Expression,
  context: 'text' | 'attribute',
): E.Expression {
  let value: E.Expression = createTemplateLiteral(['', ''], [node]);
  const replacements = [
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ...(context === 'attribute' ? [['"', '&quot;']] : []),
  ];
  for (const [character, entity] of replacements) {
    value = createCallExpression(createMemberExpression(value, 'replaceAll'), [
      createLiteral(character),
      createLiteral(entity),
    ]);
  }
  return value;
}

// Attach children to template content, or after void elements, e.g. `<img>hello</img>` becomes `<img>hello`.
export function appendHtmlChild(parent: H.ParentNode, child: H.ChildNode): void {
  if ('tagName' in parent && voidElements.has(parent.tagName) && parent.parentNode)
    parent = parent.parentNode;
  defaultTreeAdapter.appendChild('content' in parent ? parent.content : parent, child);
}

// Choose document or fragment parsing, e.g. `<html>...</html>` uses `parse`.
function getHtmlParser(html: string) {
  return html.indexOf('<html>') >= 0 || html.indexOf('<body>') >= 0 || html.indexOf('<head>') >= 0
    ? parse
    : parseFragment;
}

// Keep callbacks in class scope so private names and render-local variables remain accessible.
// e.g. `onclick={this.#increment}` becomes `event => this.#increment(event)` inside render().
// An inline HTML handler such as `onclick="this.#increment(event)"` has no private class scope.
function createEventCallback(expression: E.Expression): E.ArrowFunctionExpression | undefined {
  // Preserve authored callbacks, e.g. `event => this.#count.set(count.get() + event.detail)`.
  if (expression.type === 'ArrowFunctionExpression') return expression;

  if (
    expression.type === 'MemberExpression' &&
    expression.object.type === 'ThisExpression' &&
    !expression.computed
  ) {
    return createArrowFunctionExpression(
      ['event'],
      createCallExpression(expression, [createIdentifier('event')]),
    );
  }

  if (
    expression.type === 'AssignmentExpression' &&
    expression.left.type === 'MemberExpression' &&
    expression.left.object.type === 'ThisExpression' &&
    !expression.left.computed
  ) {
    // `onclick={(this.#count += 1)}` becomes `() => { this.#count += 1; this.render(); }`.
    return createArrowFunctionExpression(
      [],
      createBlockStatement([
        createExpressionStatement(expression),
        createExpressionStatement(createCallExpression(createThisMemberExpression('render'))),
      ]),
    );
  }

  return undefined;
}

// parse5 applies browser HTML parsing rules to the markup constructed from JSX. These rules can
// insert elements or change nesting: `<table><tr><td>...</td></tr></table>` gains a `<tbody>` around `<tr>`.
// Listener selectors must follow that resulting tree (`table > tbody > tr > td`) to match the rendered DOM.
// parse5 accepts HTML strings, not JavaScript AST expressions, so markers such as `wcc-expression-0-end`
// stand in for `{count}` or an event callback while it parses and serializes the markup. build() restores
// expression AST nodes into the template literal and removes event markers after recording their targets.
export function createHtmlTemplateLiteralBuilder(
  moduleContents: string,
): HtmlTemplateLiteralBuilder {
  let prefix = 'wcc-expression-';
  while (moduleContents.includes(prefix)) prefix += '-';
  const expressions = new Map<string, E.Expression>();
  const handlers = new Map<string, { name: string; callback: E.ArrowFunctionExpression }>();
  const targets: Array<{
    selector: string;
    rootSelector: string;
    handlers: Array<{ name: string; callback: E.ArrowFunctionExpression }>;
  }> = [];
  let referencePrefix = '$evEl';
  // A local such as `const $evEl0 = 2` must remain visible inside an authored callback.
  while (moduleContents.includes(referencePrefix)) referencePrefix += '_';
  let rootPrefix = '$evRoot';
  while (moduleContents.includes(rootPrefix)) rootPrefix += '_';
  // Give each expression or handler a distinct placeholder, e.g. `wcc-expression-0-end`.
  const token = () => `${prefix}${expressions.size + handlers.size}-end`;

  return {
    // Save an interpolation node and return its placeholder, e.g. the `count` in `{count}`.
    expression(node, context = 'text') {
      const marker = token();
      expressions.set(
        marker,
        context === 'raw' ? node : createEscapedHtmlExpression(node, context),
      );
      return marker;
    },
    // e.g. `<button onclick={this.#increment}>` temporarily carries `onclick="wcc-expression-0-end"`.
    // The marker stays on its element if parse5 inserts a parent such as <tbody>; the callback stays as AST.
    // build() records the element's path in the resulting tree, then removes the temporary event attribute.
    handler(name, expression) {
      const callback = createEventCallback(expression);
      if (!callback) return undefined;
      const marker = token();
      handlers.set(marker, { name: name.slice(2), callback });
      return marker;
    },
    // Emit bindings after mounting, e.g. `$evEl0?.addEventListener('click', event => this.#increment(event))`.
    // The initial Shadow DOM render can bind existing DSD nodes; later renders bind replacement nodes.
    // Keeping callbacks here preserves access to render-local values such as `const step = 2`.
    listeners(hasShadowRoot) {
      const root = hasShadowRoot
        ? createThisMemberExpression('shadowRoot')
        : createThisExpression();
      const rootSelectors = [...new Set(targets.map(({ rootSelector }) => rootSelector))];
      // Cache each distinct template root once per render, e.g. `const $evRoot0 = this.querySelector('div:nth-of-type(1)')`.
      // Number roots independently of targets: `$evEl0` and `$evEl1` can both query `$evRoot0`.
      const statements: E.Statement[] = rootSelectors.map((selector, index) => ({
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: createIdentifier(`${rootPrefix}${index}`),
            init: createCallExpression(createMemberExpression(root, 'querySelector'), [
              createLiteral(selector),
            ]),
          },
        ],
      }));
      targets.forEach(({ selector, rootSelector, handlers }, index) => {
        // Scope descendant lookups to the cached root, e.g. `$evRoot0?.querySelector(':scope > button:nth-of-type(1)')`.
        // Without :scope, a button in nested <section> markup could receive the outer button's listener.
        const templateRoot = createIdentifier(
          `${rootPrefix}${rootSelectors.indexOf(rootSelector)}`,
        );
        // For `<button onclick={this.#increment}>`, the target is the cached template root.
        // A descendant such as `<div><button ... /></div>` needs the relative query instead.
        const target: E.Expression = selector
          ? {
              type: 'ChainExpression',
              expression: createCallExpression(
                { ...createMemberExpression(templateRoot, 'querySelector'), optional: true },
                [createLiteral(`:scope > ${selector}`)],
              ),
            }
          : templateRoot;
        const reference = createIdentifier(`${referencePrefix}${index}`);
        statements.push(
          {
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: reference,
                init: target,
              },
            ],
          },
          ...handlers.map(({ name, callback }) =>
            // SSR querySelector() returns undefined; `$evEl0?.addEventListener(...)` skips binding there.
            createExpressionStatement({
              type: 'ChainExpression',
              expression: createCallExpression(
                { ...createMemberExpression(reference, 'addEventListener'), optional: true },
                [createLiteral(name), callback],
              ),
            }),
          ),
        );
      });
      // One block keeps generated references local without shadowing the authored render scope.
      return statements.length ? [createBlockStatement(statements)] : [];
    },
    // Normalize HTML and restore its interpolations to produce a template literal node.
    build(htmlTree) {
      // Constructing parse5 nodes directly does not apply HTML parsing rules. Parse their serialized markup
      // so implied parents such as <tbody> are present before computing selectors and emitting the template.
      // TODO: review removing this round trip while retaining HTML normalization and event targets.
      const html = serialize(htmlTree);
      const tree = getHtmlParser(html)(html);

      // Resolve paths after HTML normalization (for example, table rows acquire a tbody).
      // e.g. `<table><tr><td onclick={this.#select}>` needs `table > tbody > tr > td` in its path.
      function collectEventTargets(parent: H.Node, path: string[] = []): void {
        const counts = new Map<string, number>();
        for (const node of 'childNodes' in parent ? parent.childNodes : []) {
          if (!('tagName' in node)) continue;
          const index = (counts.get(node.tagName) ?? 0) + 1;
          counts.set(node.tagName, index);
          const nodePath = [...path, `${node.tagName}:nth-of-type(${index})`];
          const bindings: Array<{ name: string; callback: E.ArrowFunctionExpression }> = [];
          node.attrs = node.attrs.filter((attr) => {
            const handler = handlers.get(attr.value);
            if (!handler) return true;
            // Multiple attributes, e.g. `onclick={...} onfocus={...}`, share one target lookup.
            // Keep their callbacks in attribute order and remove each temporary marker attribute.
            bindings.push(handler);
            return false;
          });
          if (bindings.length)
            targets.push({
              rootSelector: nodePath[0],
              selector: nodePath.slice(1).join(' > '),
              handlers: bindings,
            });
          collectEventTargets(node, nodePath);
        }
      }
      collectEventTargets(tree);
      const template = createTemplateLiteralParts();
      for (const part of serialize(tree).split(new RegExp(`(${prefix}\\d+-end)`, 'g'))) {
        const expression = expressions.get(part);
        // Restore original expression AST nodes so `this.#count` stays inside its declaring class.
        // Keeping each interpolation in place also preserves evaluation order.
        if (expression) template.expression(expression);
        else template.text(part);
      }
      return template.build();
    },
  };
}

// Track the first listener initialization separately from subsequent explicit renders.
// e.g. `#evInitialized = false` allows the first render to reuse populated declarative Shadow DOM.
export function createEventInitializationField(name: string): E.PropertyDefinition {
  return {
    ...createPropertyDefinition(name, createLiteral(false)),
    key: { type: 'PrivateIdentifier', name },
  };
}

// Create render statements, e.g. `this.innerHTML = ...`, with Shadow DOM setup when needed.
export function createRenderStatements(
  template: E.TemplateLiteral,
  hasShadowRoot: boolean,
  eventInitializationField?: string,
): E.Statement[] {
  if (hasShadowRoot && eventInitializationField) {
    const initialized = createMemberExpression(createThisExpression(), {
      type: 'PrivateIdentifier',
      name: eventInitializationField,
    });
    // Reuse populated DSD on the first call. Keep all template creation and interpolation inside
    // the condition so binding listeners does not evaluate markup or replace server-rendered nodes.
    // e.g. `if (this.#evInitialized || !this.shadowRoot?.firstChild) { ...mount... }`.
    // An empty root (including one just created by connectedCallback) still needs its initial markup.
    return [
      {
        type: 'IfStatement',
        test: createBinaryExpression(
          '||',
          initialized,
          createUnaryExpression('!', {
            type: 'ChainExpression',
            expression: {
              ...createMemberExpression(createThisMemberExpression('shadowRoot'), 'firstChild'),
              optional: true,
            },
          }),
        ),
        consequent: createBlockStatement(createRenderStatements(template, true)),
        alternate: null,
      },
      // Subsequent explicit render() calls update the DOM and rebind listeners as usual.
      createExpressionStatement(createAssignmentExpression(initialized, createLiteral(true))),
    ];
  }
  // TODO: could / should we do something else instead of .innerHTML
  // https://github.com/ProjectEvergreen/wcc/issues/138
  if (!hasShadowRoot) {
    return [
      createExpressionStatement(
        createAssignmentExpression(createThisMemberExpression('innerHTML'), template),
      ),
    ];
  }
  const templateElement = createIdentifier('template');
  return [
    {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: templateElement,
          init: createCallExpression(
            createMemberExpression(createIdentifier('document'), 'createElement'),
            [createLiteral('template')],
          ),
        },
      ],
    },
    createExpressionStatement(
      createAssignmentExpression(createMemberExpression(templateElement, 'innerHTML'), template),
    ),
    {
      type: 'IfStatement',
      test: createUnaryExpression('!', createThisMemberExpression('shadowRoot')),
      // First mount without an existing root: attachShadow(), then append the cloned template content.
      consequent: createBlockStatement([
        createExpressionStatement(
          createCallExpression(createThisMemberExpression('attachShadow'), [
            {
              type: 'ObjectExpression',
              properties: [
                {
                  type: 'Property',
                  key: createIdentifier('mode'),
                  value: createLiteral('open'),
                  kind: 'init',
                  method: false,
                  shorthand: false,
                  computed: false,
                },
              ],
            },
          ]),
        ),
        createExpressionStatement(
          createCallExpression(
            createMemberExpression(createThisMemberExpression('shadowRoot'), 'appendChild'),
            [
              createCallExpression(
                createMemberExpression(
                  createMemberExpression(templateElement, 'content'),
                  'cloneNode',
                ),
                [createLiteral(true)],
              ),
            ],
          ),
        ),
      ]),
      // An empty existing root or a subsequent explicit render receives the new template contents.
      alternate: createBlockStatement([
        createExpressionStatement(
          createAssignmentExpression(
            createMemberExpression(createThisMemberExpression('shadowRoot'), 'innerHTML'),
            createMemberExpression(templateElement, 'innerHTML'),
          ),
        ),
      ]),
    },
  ];
}

// Create an instance property access, e.g. `this.count`.
function createThisMemberExpression(name: string): E.MemberExpression {
  return createMemberExpression(createThisExpression(), name);
}

// Create a signal read, e.g. `this.count.get()`.
function createSignalValueExpression(name: string): E.CallExpression {
  return createCallExpression(createMemberExpression(createThisMemberExpression(name), 'get'));
}

// Create a static text template and its call, e.g. `Counter.$$tmpl0(this.count.get())`.
// Private reads stay in instance scope: `static $$tmpl0 = count => ...` receives `this.#count.get()`.
export function createReactiveTemplate(
  name: string,
  signals: ReactiveSignal[],
  template: TemplateLiteralParts,
  componentName: string,
): ReactiveTemplate {
  return {
    template: createPropertyDefinition(
      name,
      createArrowFunctionExpression(
        signals.map(({ name }) => name),
        template.build(true),
      ),
      true,
    ),
    expression: createCallExpression(
      createMemberExpression(createIdentifier(componentName), name),
      signals.map(({ name, expression }) => expression ?? createSignalValueExpression(name)),
    ),
  };
}

// Create effect registrations, e.g. `this.$eff0 = effect(() => { ... });`.
export function createEffectStatements(reactiveElements: ReactiveElement[]): E.Statement[] {
  const statements: E.Statement[] = [];
  let effectsCount = 0;
  // Append a registration that saves the effect's disposer in `this.$eff0`, `this.$eff1`, etc.
  const addEffect = (body: E.Statement[]) => {
    statements.push(
      createExpressionStatement(
        createAssignmentExpression(
          createThisMemberExpression(`$eff${effectsCount++}`),
          createCallExpression(createIdentifier('effect'), [
            createArrowFunctionExpression([], createBlockStatement(body)),
          ]),
        ),
      ),
    );
  };

  reactiveElements.forEach(({ effect, attributes }, idx) => {
    if (effect?.expression) {
      // Text bindings call the static template with live reads, e.g. `Counter.$$tmpl0(this.#count.get())`.
      addEffect([
        createExpressionStatement(
          createAssignmentExpression(
            createMemberExpression(createThisMemberExpression(`$el${idx}`), 'textContent'),
            effect.expression,
          ),
        ),
      ]);
    }
    if (attributes.length > 0) {
      // Attribute bindings use setAttribute('title', ...); the explicit innerHTML prop writes markup through `.innerHTML = ...`.
      // Saved private-read AST takes precedence over public name lookup.
      addEffect(
        attributes.map((attr) =>
          createExpressionStatement(
            attr.name === 'innerHTML'
              ? createAssignmentExpression(
                  createMemberExpression(createThisMemberExpression(`$el${idx}`), 'innerHTML'),
                  attr.expression ?? createSignalValueExpression(attr.value),
                )
              : createCallExpression(
                  createMemberExpression(createThisMemberExpression(`$el${idx}`), 'setAttribute'),
                  [
                    createLiteral(attr.name),
                    attr.expression ?? createSignalValueExpression(attr.value),
                  ],
                ),
          ),
        ),
      );
    }
  });
  return statements;
}

// Create disposer calls for generated effects, e.g. `this.$eff0();`.
export function createEffectCleanupStatements(reactiveElements: ReactiveElement[]): E.Statement[] {
  const statements: E.Statement[] = [];
  for (const { effect, attributes } of reactiveElements) {
    if (effect?.expression) {
      statements.push(
        createExpressionStatement(
          createCallExpression(createThisMemberExpression(`$eff${statements.length}`)),
        ),
      );
    }
    if (attributes.length > 0) {
      statements.push(
        createExpressionStatement(
          createCallExpression(createThisMemberExpression(`$eff${statements.length}`)),
        ),
      );
    }
  }
  return statements;
}

// Create attribute conversion and change-handler methods, e.g. `this[name].set(Counter.parseAttribute(newValue))`.
function createAttributeMethods(
  componentName: string,
): Array<E.PropertyDefinition | E.MethodDefinition> {
  // TODO: better way to determine value type, e,g. array, number, object, etc for `parseAttribute`?
  // Reference the attribute value parameter: `value`.
  const createValueReference = () => createIdentifier('value');
  // Compare the attribute value with a literal, e.g. `value === 'true'`.
  const createValueComparison = (text: string) =>
    createBinaryExpression('===', createValueReference(), createLiteral(text));
  // Check the first character to recognize JSON, e.g. `value.charAt(0) === '{'`.
  const createFirstCharacterComparison = (text: string) =>
    createBinaryExpression(
      '===',
      createCallExpression(createMemberExpression(createValueReference(), 'charAt'), [
        createLiteral(0),
      ]),
      createLiteral(text),
    );

  return [
    createPropertyDefinition(
      'parseAttribute',
      createArrowFunctionExpression(
        ['value'],
        createConditionalExpression(
          createBinaryExpression(
            '||',
            createFirstCharacterComparison('{'),
            createFirstCharacterComparison('['),
          ),
          createCallExpression(createMemberExpression(createIdentifier('JSON'), 'parse'), [
            createValueReference(),
          ]),
          createConditionalExpression(
            createBinaryExpression(
              '&&',
              createBinaryExpression('!==', createValueReference(), createLiteral('')),
              createUnaryExpression(
                '!',
                createCallExpression(createIdentifier('isNaN'), [
                  createUnaryExpression('+', createValueReference()),
                ]),
              ),
            ),
            createCallExpression(createIdentifier('parseInt'), [
              createValueReference(),
              createLiteral(10),
            ]),
            createConditionalExpression(
              createBinaryExpression(
                '||',
                createValueComparison('true'),
                createValueComparison('false'),
              ),
              createConditionalExpression(
                createValueComparison('true'),
                createLiteral(true),
                createLiteral(false),
              ),
              createValueReference(),
            ),
          ),
        ),
      ),
      true,
    ),
    createMethodDefinition(
      'attributeChangedCallback',
      ['name', 'oldValue', 'newValue'],
      [
        createExpressionStatement(
          createCallExpression(
            createMemberExpression(
              createMemberExpression(createThisExpression(), createIdentifier('name'), true),
              'set',
            ),
            [
              createCallExpression(
                createMemberExpression(createIdentifier(componentName), 'parseAttribute'),
                [createIdentifier('newValue')],
              ),
            ],
          ),
        ),
      ],
    ),
  ];
}

// Create reactive fields and lifecycle methods, e.g. `$el0;` and `static get observedAttributes() { ... }`.
export function createReactiveClassMembers(
  componentName: string,
  reactiveElements: ReactiveElement[],
  observedAttributes: string[],
  hasDisconnectedCallback: boolean,
): Array<E.PropertyDefinition | E.MethodDefinition> {
  const members: Array<E.PropertyDefinition | E.MethodDefinition> = [
    ...reactiveElements.map((el, idx) => createPropertyDefinition(`$el${idx}`)),
    ...reactiveElements.flatMap((el) => (el.effect ? [el.effect.template] : [])),
    createMethodDefinition(
      'observedAttributes',
      [],
      [
        {
          type: 'ReturnStatement',
          argument: {
            type: 'ArrayExpression',
            elements: observedAttributes.map((attr) => createLiteral(attr)),
          },
        },
      ],
      'get',
      true,
    ),
    ...createAttributeMethods(componentName),
  ];
  if (!hasDisconnectedCallback) {
    members.push(
      createMethodDefinition(
        'disconnectedCallback',
        [],
        createEffectCleanupStatements(reactiveElements),
      ),
    );
  }
  return members;
}

// Cache reactive DOM nodes, e.g. `this.$el0 = this.shadowRoot.querySelector('span');`.
export function createElementReferenceStatements(
  reactiveElements: ReactiveElement[],
  hasShadowRoot: boolean,
): E.Statement[] {
  const root = hasShadowRoot ? createThisMemberExpression('shadowRoot') : createThisExpression();
  return reactiveElements.map((el, idx) =>
    createExpressionStatement(
      createAssignmentExpression(
        createThisMemberExpression(`$el${idx}`),
        createCallExpression(createMemberExpression(root, 'querySelector'), [
          createLiteral(el.selector),
        ]),
      ),
    ),
  );
}

// Import the effect helper: `import { effect } from 'wc-compiler/effect'`.
export function createEffectImportDeclaration(): E.ImportDeclaration {
  return {
    type: 'ImportDeclaration',
    specifiers: [
      {
        type: 'ImportSpecifier',
        imported: createIdentifier('effect'),
        local: createIdentifier('effect'),
      },
    ],
    source: createLiteral('wc-compiler/effect'),
    attributes: [],
  };
}
