import { Parser } from 'acorn';
import * as acornWalk from 'acorn-walk';
import { generate, GENERATOR } from 'astring';
import { defaultTreeAdapter, html, parse, parseFragment, serialize } from 'parse5';
import type * as E from 'estree-jsx';
import type { Generator, State } from 'astring';
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
  expression(node: E.Expression): string;
  handler(create: (depth: number) => string | undefined): string;
  build(tree: H.ParentNode): E.TemplateLiteral;
}

export interface ReactiveTemplate {
  template: E.PropertyDefinition;
  expression: E.CallExpression;
}

export interface ReactiveElement {
  selector: string;
  effect?: ReactiveTemplate;
  attributes: Array<{ name: string; value: string }>;
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
  property: string | E.Expression,
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
): E.CallExpression => ({
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

// Parse source attributes in their quoting context, e.g. `{0x10}` keeps `0x10` as its value.
export function createHtmlLiteralAttributes(
  name: string,
  literal: E.Literal,
  isJsxAttribute = false,
): Token.Attribute[] {
  const value = isJsxAttribute ? `"${literal.value}"` : literal.raw;
  // Required markup string: parse5's public parser needs HTML to interpret attribute quoting/entities.
  // TODO: review replacing this markup wrapper while preserving attribute quoting and entity handling.
  // TODO: escape decoded JSX quotes; `title="&quot;Hello&quot;"` currently creates malformed attributes.
  const fragment = parseFragment(`<span ${name}=${value}></span>`);
  const node = fragment.childNodes[0];
  return 'attrs' in node ? node.attrs : [];
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

// Print assignments without spaces, e.g. `this.count-=1`, for onclick attributes.
// Output tests expect this compact format in the generated SSR markup.
function printNode(generator: Generator, node: E.Node, state: State): void {
  const print = generator[node.type] as (node: E.Node, state: State) => void;
  print.call(generator, node, state);
}

const eventGenerator: Generator = {
  ...GENERATOR,
  AssignmentExpression(node, state) {
    printNode(this, node.left, state);
    state.write(node.operator);
    printNode(this, node.right, state);
  },
};

// Reference the component from an event target, e.g. `this.parentElement` or `this.getRootNode().host`.
function createComponentReference(depth: number, hasShadowRoot: boolean): E.Expression {
  if (hasShadowRoot) {
    return createMemberExpression(
      createCallExpression(createThisMemberExpression('getRootNode')),
      'host',
    );
  }
  let reference: E.Expression = createThisExpression();
  for (let i = 0; i < depth; i++) {
    reference = createMemberExpression(reference, 'parentElement');
  }
  return reference;
}

// Generate a method or assignment handler string, e.g. `this.parentElement.increment(event)`.
export function generateEventHandler(
  expression: E.Expression | E.JSXEmptyExpression,
  depth: number,
  hasShadowRoot: boolean,
): string | undefined {
  const root = createComponentReference(depth, hasShadowRoot);
  if (
    expression.type === 'MemberExpression' &&
    expression.object.type === 'ThisExpression' &&
    expression.property.type === 'Identifier'
  ) {
    return generate(
      createCallExpression(createMemberExpression(root, expression.property.name), [
        createIdentifier('event'),
      ]),
    );
  }
  if (
    expression.type === 'AssignmentExpression' &&
    expression.left.type === 'MemberExpression' &&
    expression.left.object.type === 'ThisExpression' &&
    expression.left.property.type === 'Identifier'
  ) {
    const body = [
      createExpressionStatement(
        createAssignmentExpression(
          createMemberExpression(root, expression.left.property.name),
          // Only literal right-hand sides are supported; other expressions emit undefined.
          !('raw' in expression.right) || expression.right.raw === undefined
            ? createIdentifier('undefined')
            : expression.right,
          expression.operator,
        ),
      ),
      createExpressionStatement(createCallExpression(createMemberExpression(root, 'render'))),
    ];
    const program: E.Program = { type: 'Program', sourceType: 'module', body };
    return generate(program, { generator: eventGenerator, indent: '', lineEnd: ' ' }).trim();
  }
  return undefined;
}

// Generate an arrow-handler wrapper that receives the component as `self`, e.g. `self.count.set(1)`.
export function generateInlineEventHandler(
  expression: E.ArrowFunctionExpression,
  depth: number,
  hasShadowRoot: boolean,
): string {
  const body = structuredClone(expression.body);
  walkSimple(body, {
    MemberExpression(node) {
      if (node.object.type === 'ThisExpression') {
        node.object = createIdentifier('self');
      }
    },
  });
  const fn: E.FunctionExpression = {
    type: 'FunctionExpression',
    id: null,
    params: [
      createIdentifier(
        (expression.params[0]?.type === 'Identifier' ? expression.params[0].name : undefined) ||
          'event',
      ),
      createIdentifier('self'),
    ],
    // Block handlers stay inside the wrapper: `function (event, self) { { ... } }`.
    body: createBlockStatement([
      body.type === 'BlockStatement' ? body : createExpressionStatement(body),
    ]),
    generator: false,
    async: false,
  };
  return generate(
    createCallExpression(fn, [
      createIdentifier('event'),
      createComponentReference(depth, hasShadowRoot),
    ]),
  );
}

// Use parse5 to normalize HTML while keeping JavaScript expressions as AST nodes.
// Placeholders such as `wcc-expression-0-end` mark where `${count}` belongs in the template literal.
export function createHtmlTemplateLiteralBuilder(
  moduleContents: string,
): HtmlTemplateLiteralBuilder {
  let prefix = 'wcc-expression-';
  while (moduleContents.includes(prefix)) prefix += '-';
  const expressions = new Map<string, E.Expression>();
  const handlers = new Map<string, (depth: number) => string | undefined>();
  // Give each expression or handler a distinct placeholder, e.g. `wcc-expression-0-end`.
  const token = () => `${prefix}${expressions.size + handlers.size}-end`;
  return {
    // TODO: keep attribute-derived text such as `<template>` from becoming markup when interpolated.
    // https://github.com/ProjectEvergreen/wcc/issues/249
    // Save an interpolation node and return its placeholder, e.g. the `count` in `{count}`.
    expression(node) {
      const marker = token();
      expressions.set(marker, node);
      return marker;
    },
    // Defer handler generation until the parsed HTML determines its DOM depth.
    handler(create) {
      const marker = token();
      handlers.set(marker, create);
      return marker;
    },
    // Normalize HTML and restore its interpolations to produce a template literal node.
    build(htmlTree) {
      // String boundary: parse5 applies HTML tree rules (e.g. inserting tbody) when parsing text.
      // Serialize the constructed nodes so parse5 can normalize them before final serialization.
      // TODO: review removing this round trip while retaining HTML normalization and event-handler depths.
      const html = serialize(htmlTree);
      const tree = getHtmlParser(html)(html);
      // Fill event attributes with component references at the correct depth.
      function applyEventHandlers(parent: H.Node, depth = 1): void {
        for (const node of 'childNodes' in parent ? parent.childNodes : []) {
          for (const attr of 'attrs' in node ? node.attrs : []) {
            const handler = handlers.get(attr.value);
            if (handler) attr.value = handler(depth) ?? '';
          }
          applyEventHandlers(node, depth + 1);
        }
      }
      applyEventHandlers(tree);
      const template = createTemplateLiteralParts();
      for (const part of serialize(tree).split(new RegExp(`(${prefix}\\d+-end)`, 'g'))) {
        const expression = expressions.get(part);
        if (expression) template.expression(expression);
        else template.text(part);
      }
      return template.build();
    },
  };
}

// Create render statements, e.g. `this.innerHTML = ...`, with Shadow DOM setup when needed.
export function createRenderStatements(
  template: E.TemplateLiteral,
  hasShadowRoot: boolean,
): E.Statement[] {
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
export function createReactiveTemplate(
  name: string,
  signals: string[],
  template: TemplateLiteralParts,
  componentName: string,
): ReactiveTemplate {
  return {
    template: createPropertyDefinition(
      name,
      createArrowFunctionExpression(signals, template.build(true)),
      true,
    ),
    expression: createCallExpression(
      createMemberExpression(createIdentifier(componentName), name),
      signals.map((signal) => createSignalValueExpression(signal)),
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
      addEffect(
        attributes.map((attr) =>
          createExpressionStatement(
            createCallExpression(
              createMemberExpression(createThisMemberExpression(`$el${idx}`), 'setAttribute'),
              [createLiteral(attr.name), createSignalValueExpression(attr.value)],
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
