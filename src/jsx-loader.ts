// https://nodejs.org/api/esm.html#esm_loaders
import * as acorn from 'acorn';
import { generate } from 'astring';
import fs from 'fs';
// ideally we can eventually adopt an ESM compatible version of this plugin
// https://github.com/acornjs/acorn-jsx/issues/112
// but it does have a default export?
import jsx from '@projectevergreen/acorn-jsx-esm';
import { transform } from 'sucrase';
import * as ast from './jsx-ast-utils.js';
import { Signal } from 'signal-polyfill';
import type * as E from 'estree-jsx';
import { html } from 'parse5';
import type { DefaultTreeAdapterTypes as H } from 'parse5';
import type { ResolveHook, LoadHook } from 'node:module';
import type { PathOrFileDescriptor } from 'node:fs';
import type { base as acornWalkBase } from 'acorn-walk';

// expose global Signal polyfill to SSR environment
(globalThis as typeof globalThis & { Signal: typeof Signal }).Signal = Signal;

const jsxRegex = /\.(jsx)$/;
const tsxRegex = /\.(tsx)$/;

// Provide the JSX parser and walker, e.g. `getParser(new URL('./counter.tsx', import.meta.url))`.
export function getParser(moduleURL: URL):
  | {
      parser: typeof acorn.Parser;
      config: typeof acornWalkBase & { JSXElement: () => void };
    }
  | undefined {
  const ext = moduleURL.pathname.split('.').pop();
  const isJSX = ext === 'jsx' || ext === 'tsx';

  if (!isJSX) {
    return;
  }

  return {
    parser: acorn.Parser.extend(jsx()),
    config: {
      // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
      ...ast.baseWalker,
      JSXElement: () => {},
    },
  };
}

// Read an identifier's name, e.g. the AST for `count` or the JSX tag `span` yields its name.
function identifierName(node: E.Node | null | undefined): string | undefined {
  return node?.type === 'Identifier' || node?.type === 'JSXIdentifier' ? node.name : undefined;
}

// signal-style reads, e.g. `count.get()` or `this.count.get()`.
function isSignalRead(node: E.Node | null | undefined): node is E.CallExpression & {
  callee: E.MemberExpression & { property: E.Identifier };
} {
  return (
    node?.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'get'
  );
}

type ReactiveAttribute = E.JSXAttribute & {
  name: E.JSXIdentifier;
  value: E.JSXExpressionContainer & {
    expression: E.CallExpression & { callee: E.MemberExpression & { property: E.Identifier } };
  };
};

// signal-backed JSX attribute, e.g. `<span title={label.get()} />`.
function isReactiveAttribute(
  attribute: E.JSXAttribute | E.JSXSpreadAttribute,
): attribute is ReactiveAttribute {
  return (
    attribute.type === 'JSXAttribute' &&
    attribute.name.type === 'JSXIdentifier' &&
    attribute.value?.type === 'JSXExpressionContainer' &&
    isSignalRead(attribute.value.expression)
  );
}

// Extract the signal name, e.g. `count.get()` and `this.count.get()` both yield `count`.
function getSignalName(
  node: E.CallExpression & { callee: E.MemberExpression },
): string | undefined {
  const object = node.callee.object;
  if (object.type === 'MemberExpression' && object.object.type === 'ThisExpression') {
    return identifierName(object.property);
  }
  return identifierName(object);
}

// Track component properties, e.g. `this.count = 0`, `const count = this.count`, or `const { count } = this`.
// TODO: handle if / else statements
// https://github.com/ProjectEvergreen/wcc/issues/88
function findThisReferences(
  context: 'render' | 'constructor',
  statement: E.Statement,
): Array<string | E.VariableDeclarator> {
  const references: Array<string | E.VariableDeclarator> = [];

  if (context === 'constructor' && statement.type === 'ExpressionStatement') {
    const expression = statement.expression;

    if (
      expression.type === 'AssignmentExpression' &&
      expression.left.type === 'MemberExpression' &&
      expression.left.object.type === 'ThisExpression'
    ) {
      const name = identifierName(expression.left.property);

      if (name) references.push(name);
    }
  } else if (context === 'render' && statement.type === 'VariableDeclaration') {
    for (const declaration of statement.declarations) {
      const { init, id } = declaration;

      if (init?.type === 'MemberExpression' && init.object.type === 'ThisExpression') {
        const name = identifierName(init.property);

        if (name) references.push(name);
      } else if (init?.type === 'ThisExpression' && id.type === 'ObjectPattern') {
        for (const property of id.properties) {
          if (property.type === 'Property') {
            const name = identifierName(property.key);

            if (name) references.push(name);
          }
        }
      } else {
        // Keep derived declarations for the later signal-analysis pass.
        references.push(declaration);
      }
    }
  }
  return references;
}

// Create HTML nodes from JSX, e.g. `<p>{count}</p>` becomes an element with an interpolation marker.
function createHtmlTreeFromJsx(
  element: E.JSXElement['children'][number],
  template: ast.HtmlTemplateLiteralBuilder,
  inferredObservability: boolean,
  hasShadowRoot = false,
  currentDepth = 1,
  parent: H.ParentNode = ast.createHtmlFragment(),
  context?: JsxCompilationContext,
): H.ParentNode {
  const { type } = element;

  if (type === 'JSXElement') {
    const { openingElement } = element;
    if (openingElement.name.type !== 'JSXIdentifier') return parent;
    const node = ast.createHtmlElement(openingElement.name.name);
    const innerHtml = openingElement.attributes.find(
      (attribute) =>
        attribute.type === 'JSXAttribute' &&
        attribute.name.type === 'JSXIdentifier' &&
        attribute.name.name === 'innerHTML',
    );

    if (innerHtml) {
      const hasChildren = element.children.some(
        (child) =>
          !(child.type === 'JSXText' && child.value.trim() === '') &&
          !(
            child.type === 'JSXExpressionContainer' &&
            child.expression.type === 'JSXEmptyExpression'
          ),
      );
      if (hasChildren) throw new Error('JSX innerHTML cannot be combined with children.');
      if (ast.isVoidHtmlElement(node.tagName)) {
        throw new Error(`JSX innerHTML cannot be used on void element <${node.tagName}>.`);
      }
    }

    ast.appendHtmlChild(parent, node);

    for (const attribute of openingElement.attributes) {
      if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') continue;
      const { name } = attribute.name;
      const { value } = attribute;
      const expression = value?.type === 'JSXExpressionContainer' ? value.expression : value;

      // WCC's innerHTML prop inserts unescaped child markup instead of emitting an HTML attribute.
      if (name === 'innerHTML') {
        if (!expression || expression.type === 'JSXEmptyExpression') {
          throw new Error('JSX innerHTML requires a value.');
        }
        // A quoted JSX attribute's raw source still contains entities; its value is decoded.
        const content =
          value?.type === 'Literal'
            ? {
                ...value,
                value: ast.createHtmlLiteralAttributes(name, value, true)[0].value,
                raw: undefined,
              }
            : expression;
        ast.appendHtmlChild(node, ast.createHtmlTextNode(template.expression(content, 'raw')));
      } else if (name.startsWith('on')) {
        if (value?.type === 'JSXExpressionContainer') {
          const { expression } = value;
          if (expression.type === 'ArrowFunctionExpression' && expression.body) {
            node.attrs.push(
              ast.createHtmlAttribute(
                name,
                template.handler((depth) =>
                  ast.generateInlineEventHandler(expression, depth, hasShadowRoot),
                ),
              ),
            );
          } else if (
            ast.generateEventHandler(expression, currentDepth, hasShadowRoot) !== undefined
          ) {
            node.attrs.push(
              ast.createHtmlAttribute(
                name,
                template.handler((depth) =>
                  ast.generateEventHandler(expression, depth, hasShadowRoot),
                ),
              ),
            );
          }
        }
      } else if (!expression) {
        node.attrs.push(ast.createHtmlAttribute(name));
      } else if (expression.type === 'Literal') {
        node.attrs.push(
          ...ast.createHtmlLiteralAttributes(name, expression, value?.type === 'Literal'),
        );
      } else if (expression.type !== 'JSXEmptyExpression') {
        node.attrs.push(
          ast.createHtmlAttribute(name, template.expression(expression, 'attribute')),
        );
      }
    }

    if (!innerHtml) {
      for (const child of element.children) {
        createHtmlTreeFromJsx(
          child,
          template,
          inferredObservability,
          hasShadowRoot,
          currentDepth + 1,
          node,
          context,
        );
      }
    }

    // HTML treats </br> as another <br>; JSX br output includes both line-break nodes.
    // TODO: emit one break for JSX <br />; the extra node preserves the current compiler output.
    if (node.tagName === 'br') {
      ast.appendHtmlChild(parent, ast.createHtmlElement('br'));
    }
  }

  if (type === 'JSXText') {
    ast.appendHtmlChild(
      parent,
      ast.createHtmlTextNode(element.raw, 'tagName' in parent ? parent.tagName : undefined),
    );
  }

  if (type === 'JSXExpressionContainer' && element.expression.type !== 'JSXEmptyExpression') {
    const parentTag = 'tagName' in parent ? parent.tagName : '';
    const raw = html.hasUnescapedText(parentTag, true);
    const expression = context
      ? raw
        ? (compileJsxValueExpressions(
            element.expression,
            context,
            hasShadowRoot,
            currentDepth,
          ) as E.Expression)
        : compileJsxChildExpression(element.expression, context, hasShadowRoot, currentDepth)
      : element.expression;
    // Keep `{items.map(...)}` as an AST expression while parse5 handles the surrounding HTML.
    // E.g. `<tbody>{rows}</tbody>` temporarily contains `<!--wcc-expression-0-end-->`.
    const slot = template.expression(expression, context || raw ? 'raw' : 'text');
    ast.appendHtmlChild(
      parent,
      raw || parentTag === 'textarea' || parentTag === 'title'
        ? ast.createHtmlTextNode(slot, parentTag)
        : ast.createHtmlChildSlot(slot),
    );
  }
  return parent;
}

// State for compiling one module; this object is not emitted into the generated JavaScript.
// E.g. remember a `$$wccChild(title)` CallExpression so it can later become `Posts.$$wccChild(title)`.
interface JsxCompilationContext {
  markupFunctionName: string;
  childNormalizerName: string;
  moduleContents: string;
  needsMarkupWrapper: boolean;
  childNormalizerCalls: E.CallExpression[];
}

// Build the child serializer function, e.g. `{post.summary}` becomes `Posts.$$wccChild(post.summary)`.
// It escapes ordinary text (`'<reply>'` -> '&lt;reply&gt;') and joins array children without commas.
function createJsxChildSerializer(
  name: string,
  markupClass?: string,
  reference: E.Expression = ast.createIdentifier(name),
): E.FunctionExpression {
  const program = ast.parseModule(`(function ${name}(value) {
    if (value == null || typeof value === 'boolean') return '';
    if (Array.isArray(value)) return value.map(${name}).join('');
    ${markupClass ? `if (value instanceof ${markupClass}) return value.html;` : ''}
    return \`\${value}\`.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  });`);
  const normalize = (program.body[0] as E.ExpressionStatement).expression as E.FunctionExpression;
  // Rewrite the recursive function reference, e.g. `value.map($$wccChild)` ->
  // `value.map(Posts.$$wccChild)`, so passing the method as a callback does not depend on `this`.
  const replaceReferences = (node: E.Node): E.Node => {
    if (node.type === 'Identifier' && node.name === name) return structuredClone(reference);
    const fields = node as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(fields)) {
      if (Array.isArray(value))
        fields[key] = value.map((child) => (child?.type ? replaceReferences(child) : child));
      else if (value && typeof value === 'object' && 'type' in value)
        fields[key] = replaceReferences(value as E.Node);
    }
    return node;
  };
  replaceReferences(normalize.body);
  return normalize;
}

// Distinguish JSX callbacks (`post => <li>{post.title}</li>`) from data callbacks (`post => post.title`).
function containsJsx(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if ('type' in value && value.type === 'JSXElement') return true;
  return Object.values(value).some((child) =>
    Array.isArray(child) ? child.some(containsJsx) : containsJsx(child),
  );
}

// Compile a child expression, e.g. `{title}` -> `${Posts.$$wccChild(title)}`.
// JSX elements become templates; `.map()` / `.flatMap()` expressions use compileJsxChildLoop.
function compileJsxChildExpression(
  node: E.Expression,
  context: JsxCompilationContext,
  hasShadowRoot: boolean,
  depth: number,
): E.Expression {
  if (node.type === 'JSXElement') {
    return compileJsxTemplate(node, context, hasShadowRoot, depth);
  }
  const loop = compileJsxChildLoop(node, context, hasShadowRoot, depth);
  if (loop) return loop;
  const call = ast.createCallExpression(ast.createIdentifier(context.childNormalizerName), [
    compileJsxValueExpressions(node, context, hasShadowRoot, depth) as E.Expression,
  ]);
  context.childNormalizerCalls.push(call);
  return call;
}

// Lower a direct child map into template-returning callbacks plus a join:
// `{posts.map(post => <li>{post.title}</li>)}` ->
// `${posts.map(post => `<li>${Posts.$$wccChild(post.title)}</li>`).join('')}`.
function compileJsxChildLoop(
  node: E.Expression,
  context: JsxCompilationContext,
  hasShadowRoot: boolean,
  depth: number,
): E.CallExpression | undefined {
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    ['map', 'flatMap'].includes(identifierName(node.callee.property) ?? '')
  ) {
    const callback = node.arguments[0];
    if (
      callback &&
      (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') &&
      !callback.async
    ) {
      // `posts.map(post => post.title)` stays a data map, wrapped in `Posts.$$wccChild(...)`.
      // A callback returning `<li>...</li>` instead returns HTML templates that can be joined.
      if (containsJsx(callback.body)) {
        if (callback.body.type !== 'BlockStatement') {
          callback.body = compileJsxChildExpression(callback.body, context, hasShadowRoot, depth);
        } else {
          // Preserve block statements: `post => { const title = post.title; return <li>{title}</li>; }`
          // keeps its declaration and replaces only the returned JSX with a template literal.
          // A nested `function helper() { return ...; }` owns its returns and is skipped here.
          const compileReturns = (statement: E.Node): void => {
            if (
              statement.type === 'FunctionDeclaration' ||
              statement.type === 'FunctionExpression' ||
              statement.type === 'ArrowFunctionExpression'
            )
              return;
            if (statement.type === 'ReturnStatement') {
              statement.argument = statement.argument
                ? compileJsxChildExpression(statement.argument, context, hasShadowRoot, depth)
                : { type: 'Literal', value: '' };
              return;
            }
            for (const value of Object.values(statement)) {
              if (Array.isArray(value))
                value.forEach((child) => {
                  if (child?.type) compileReturns(child);
                });
              else if (value && typeof value === 'object' && 'type' in value)
                compileReturns(value as E.Node);
            }
          };
          compileReturns(callback.body);
        }
        // Add a CallExpression/MemberExpression around the transformed map: `posts.map(...).join('')`.
        // Missing block returns become undefined; Array#join omits these naturally.
        return ast.createCallExpression(ast.createMemberExpression(node, 'join'), [
          { type: 'Literal', value: '', raw: "''" },
        ]);
      }
    }
  }
  return undefined;
}

// Convert the JSXElement to a TemplateLiteral without moving expressions out of scope.
// E.g. `<li>{this.#title}</li>` retains `this.#title` inside the generated class method.
function compileJsxTemplate(
  node: E.JSXElement,
  context: JsxCompilationContext,
  hasShadowRoot: boolean,
  depth: number,
): E.TemplateLiteral {
  const template = ast.createHtmlTemplateLiteralBuilder(context.moduleContents);
  const tree = createHtmlTreeFromJsx(
    node,
    template,
    false,
    hasShadowRoot,
    depth,
    undefined,
    context,
  );
  return template.build(tree, depth - 1);
}

// Compile JSX used as JavaScript values while preserving their original lexical scope.
// E.g. `const saved = posts.map(post => <li>{post.title}</li>)` becomes a map returning
// `$$wccMarkup(`<li>${Posts.$$wccChild(post.title)}</li>`)`, recognized when `{saved}` is serialized.
function compileJsxValueExpressions(
  node: E.Node,
  context: JsxCompilationContext,
  hasShadowRoot = false,
  depth = 1,
): E.Node {
  // Preserve scalar conditions such as `title={active ? 'active' : ''}`.
  // JSX branches such as `{active && <p>Active</p>}` are outside loop lowering.
  if (node.type === 'ConditionalExpression' || node.type === 'LogicalExpression') {
    if (containsJsx(node)) {
      throw new Error('Conditional JSX is not supported.');
    }
    return node;
  }
  if (node.type === 'JSXElement') {
    context.needsMarkupWrapper = true;
    return ast.createCallExpression(ast.createIdentifier(context.markupFunctionName), [
      compileJsxTemplate(node, context, hasShadowRoot, depth),
    ]);
  }
  const fields = node as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      fields[key] = value.map((child) =>
        child && typeof child.type === 'string'
          ? compileJsxValueExpressions(child, context, hasShadowRoot, depth)
          : child,
      );
    } else if (value && typeof value === 'object' && 'type' in value) {
      fields[key] = compileJsxValueExpressions(value as E.Node, context, hasShadowRoot, depth);
    }
  }
  return node;
}

// Compile a JSX/TSX module into a JavaScript AST with render statements and inferred effects.
// E.g. JSX `<p>{count}</p>` in render() becomes an assignment to `this.innerHTML`.
export function parseJsx(
  moduleURL: PathOrFileDescriptor,
): E.Program & { start: number; end: number } {
  const moduleContents = fs.readFileSync(moduleURL, 'utf-8');
  let helperPrefix = '$$wcc';
  // Choose generated names that cannot collide with authored source. If it contains `$$wcc`,
  // try `$$wcc_`, then `$$wcc__`, etc. E.g. an authored `$$wccChild` produces `$$wcc_Child`.
  while (moduleContents.includes(helperPrefix)) helperPrefix += '_';

  // Share generated names and pending AST rewrites across this module's JSX transformations.
  // `childNormalizerCalls` collects calls like `$$wccChild(title)` for later class qualification;
  // `needsMarkupWrapper` records JSX saved as a value, e.g. `const item = <li>{title}</li>`.
  const context: JsxCompilationContext = {
    markupFunctionName: `${helperPrefix}Markup`,
    childNormalizerName: `${helperPrefix}Child`,
    moduleContents,
    needsMarkupWrapper: false,
    childNormalizerCalls: [],
  };
  const result = transform(moduleContents, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'preserve',
  });
  // would be nice if we could do this instead, so we could know ahead of time
  // const { inferredObservability } = await import(moduleURL);
  // however, this requires making parseJsx async, but WCC acorn walking is done sync
  const hasOwnObservedAttributes = undefined;
  let inferredObservability = false;
  // TODO: "merge" observedAttributes tracking with constructor tracking
  let observedAttributes: Array<string | E.VariableDeclarator> = [];
  const constructorMembersSignals = new Map<string, { isState: boolean; isComputed: boolean }>();
  const reactiveElements: ast.ReactiveElement[] = [];
  let componentName = '';
  let hasShadowRoot = false;
  let hasDisconnectedCallback = false;
  const tree = ast.parseModule(result.code, acorn.Parser.extend(jsx()));

  // initial pass to get certain information before running JSX transformations (could we do this in one pass?)
  // 1. if `inferredObservability` is set
  // 2. get the name of the component class for `static` references
  // 3, track observed attributes from `this` references in the template
  // 4. track if Shadow DOM is being used
  // 5. track if disconnectedCallback is already defined
  ast.walkSimple(
    tree,
    {
      ExportNamedDeclaration(node) {
        const { declaration } = node;

        if (
          declaration &&
          declaration.type === 'VariableDeclaration' &&
          declaration.kind === 'const' &&
          declaration.declarations.length === 1
        ) {
          if (identifierName(declaration.declarations[0].id) === 'inferredObservability') {
            inferredObservability = Boolean(
              declaration.declarations[0].init?.type === 'Literal'
                ? declaration.declarations[0].init.raw
                : undefined,
            );
          }
        }
      },
      ExportDefaultDeclaration(node) {
        const { declaration } = node;

        if (
          declaration &&
          declaration.type === 'ClassDeclaration' &&
          declaration.id &&
          declaration.id.name
        ) {
          componentName = declaration.id.name;
        }
      },
      ClassDeclaration(node) {
        if (identifierName(node.superClass) === 'HTMLElement') {
          hasShadowRoot = false;

          ast.walkSimple(
            node.body,
            {
              CallExpression(call) {
                if (
                  call.callee.type === 'MemberExpression' &&
                  !call.callee.computed &&
                  call.callee.object.type === 'ThisExpression' &&
                  identifierName(call.callee.property) === 'attachShadow'
                ) {
                  hasShadowRoot = true;
                }
              },
            },
            { ...ast.baseWalker, JSXElement: () => {} },
          );

          for (const n1 of node.body.body) {
            if (n1.type === 'MethodDefinition') {
              const nodeName = identifierName(n1.key);
              if (nodeName === 'render') {
                for (const n2 in n1.value.body.body) {
                  const n = n1.value.body.body[n2];

                  if (n.type === 'VariableDeclaration') {
                    observedAttributes = [
                      ...observedAttributes,
                      ...findThisReferences('render', n),
                    ];
                  }
                }
              }
            }
          }
        }
      },
      MethodDefinition(node) {
        if (node.kind === 'method' && identifierName(node.key) === 'disconnectedCallback') {
          hasDisconnectedCallback = true;
        }

        if (
          node.kind === 'constructor' &&
          node?.value.type === 'FunctionExpression' &&
          node.value.body?.type === 'BlockStatement'
        ) {
          const root = node.value.body?.body;
          for (const n of root) {
            if (
              n.type === 'ExpressionStatement' &&
              n.expression?.type === 'AssignmentExpression' &&
              n.expression?.operator === '=' &&
              n.expression.left.type === 'MemberExpression' &&
              n.expression.left.object.type === 'ThisExpression'
            ) {
              const { left, right } = n.expression;
              if (
                right.type === 'NewExpression' &&
                right.callee.type === 'MemberExpression' &&
                right.callee.object.type === 'Identifier' &&
                right.callee.object.name === 'Signal' &&
                left.type === 'MemberExpression' &&
                left.property.type === 'Identifier'
              ) {
                const name = left.property.name;
                const isState = identifierName(right.callee.property) === 'State';
                const isComputed = identifierName(right.callee.property) === 'Computed';

                constructorMembersSignals.set(name, {
                  isState,
                  isComputed,
                });
              }
            }
          }
        }
      },
    },
    {
      // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
      ...ast.baseWalker,
      JSXElement: () => {},
    },
  );

  // we do this first to track reactivity usage before we transform the template and re-write its contents
  if (inferredObservability && observedAttributes.length > 0 && !hasOwnObservedAttributes) {
    // this scans for signals usage within the template and builds up a reactive list of templates + effects
    // TODO: recursive scanning for nested components
    // https://github.com/ProjectEvergreen/wcc/issues/256
    ast.walkSimple(
      tree,
      {
        MethodDefinition(node) {
          if (identifierName(node.key) === 'render') {
            for (const n2 in node.value.body.body) {
              const n = node.value.body.body[n2];

              if (n.type === 'ReturnStatement' && n.argument?.type === 'JSXElement') {
                const rootNode = n.argument;
                const parentTag =
                  rootNode.openingElement.name.type === 'JSXIdentifier'
                    ? rootNode.openingElement.name.name
                    : '';
                const children: Record<string, string[]> = {};
                const parentTemplate = ast.createTemplateLiteralParts();
                let parentHasReactiveTemplate;
                const parentHasReactiveAttributes =
                  rootNode.openingElement.attributes.some(isReactiveAttribute);
                const parentSignals: string[] = [];

                for (const child of rootNode.children) {
                  if (child.type === 'JSXText') {
                    // TODO: track top level reactivity for text nodes?
                    // https://github.com/ProjectEvergreen/wcc/issues/256
                    parentTemplate.text(ast.createHtmlTextNode(child.raw, parentTag).value);
                  } else if (child.type === 'JSXExpressionContainer') {
                    if (isSignalRead(child.expression)) {
                      const { object } = child.expression.callee || {};
                      parentTemplate.expression(
                        ast.createIdentifier(identifierName(object) ?? 'undefined'),
                      );
                      parentSignals.push(identifierName(object) ?? 'undefined');
                      parentHasReactiveTemplate = true;
                    }
                  } else if (child.type === 'JSXElement') {
                    const childTag =
                      child.openingElement.name.type === 'JSXIdentifier'
                        ? child.openingElement.name.name
                        : '';

                    // track children for determining correct effect selector
                    if (!children[childTag]) {
                      children[childTag] = [];
                    }
                    children[childTag].push(childTag);

                    // TODO: I think we are only checking for State, I think we also need to handle Computeds (by themselves) here as well
                    // TODO: should we filter the things that call .get() out against actual signals found in the constructor / JSX?
                    // https://github.com/ProjectEvergreen/wcc/issues/256
                    const hasReactiveTemplate = child.children.some(
                      (c) => c.type === 'JSXExpressionContainer' && isSignalRead(c.expression),
                    );
                    const hasReactiveAttributes =
                      child.openingElement.attributes.some(isReactiveAttribute);

                    if (hasReactiveTemplate || hasReactiveAttributes) {
                      reactiveElements.push({
                        selector: `${parentTag} > ${childTag}:nth-of-type(${children[childTag].length})`,
                        attributes: [],
                      });
                    }

                    if (hasReactiveTemplate) {
                      const signals: string[] = [];
                      const template = ast.createTemplateLiteralParts();

                      for (const c of child.children) {
                        if (c.type === 'JSXText') {
                          template.text(ast.createHtmlTextNode(c.raw, childTag).value);
                        } else if (
                          c.type === 'JSXExpressionContainer' &&
                          isSignalRead(c.expression)
                        ) {
                          // TODO: handle this references?
                          // https://github.com/ProjectEvergreen/wcc/issues/88
                          const { object } = c.expression.callee || {};
                          template.expression(
                            ast.createIdentifier(identifierName(object) ?? 'undefined'),
                          );
                          signals.push(identifierName(object) ?? 'undefined');
                        }
                      }

                      if (signals.length > 0) {
                        // TODO: handle this references?
                        // https://www.github.com/ProjectEvergreen/wcc/issues/88
                        reactiveElements[reactiveElements.length - 1].effect =
                          ast.createReactiveTemplate(
                            `$$tmpl${reactiveElements.length - 1}`,
                            signals,
                            template,
                            componentName,
                          );
                      }
                    }

                    if (hasReactiveAttributes) {
                      for (const attr of child.openingElement.attributes) {
                        if (isReactiveAttribute(attr)) {
                          const value = getSignalName(attr.value.expression) ?? 'undefined';

                          reactiveElements[reactiveElements.length - 1].attributes.push({
                            name: attr.name.name,
                            value,
                          });
                        }
                      }
                    }
                  }
                }

                if (parentHasReactiveTemplate || parentHasReactiveAttributes) {
                  // TODO: handle this references?
                  // https://www.github.com/ProjectEvergreen/wcc/issues/88
                  reactiveElements.push({
                    selector: `${parentTag}:nth-of-type(1)`,
                    effect: parentHasReactiveTemplate
                      ? ast.createReactiveTemplate(
                          `$$tmpl${reactiveElements.length}`,
                          parentSignals,
                          parentTemplate,
                          componentName,
                        )
                      : undefined,
                    attributes: [],
                  });

                  if (parentHasReactiveAttributes) {
                    for (const attr of rootNode.openingElement.attributes) {
                      if (isReactiveAttribute(attr)) {
                        const value = getSignalName(attr.value.expression) ?? 'undefined';

                        reactiveElements[reactiveElements.length - 1].attributes.push({
                          name: attr.name.name,
                          value,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        },
      },
      {
        // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
        ...ast.baseWalker,
        JSXElement: () => {},
      },
    );
  }

  // apply all JSX transformations
  ast.walkSimple(
    tree,
    {
      ClassDeclaration(node) {
        if (identifierName(node.superClass) === 'HTMLElement') {
          for (const n1 of node.body.body) {
            if (n1.type === 'MethodDefinition') {
              const nodeName = identifierName(n1.key);
              if (nodeName === 'render') {
                n1.value.body.body = n1.value.body.body.flatMap((statement) => {
                  if (
                    statement.type !== 'ReturnStatement' ||
                    statement.argument?.type !== 'JSXElement'
                  ) {
                    return [statement];
                  }
                  const template = ast.createHtmlTemplateLiteralBuilder(moduleContents);
                  const htmlTree = createHtmlTreeFromJsx(
                    statement.argument,
                    template,
                    inferredObservability,
                    hasShadowRoot,
                    1,
                    undefined,
                    context,
                  );
                  return ast.createRenderStatements(template.build(htmlTree), hasShadowRoot);
                });
              }
            }
          }
          compileJsxValueExpressions(node, context, hasShadowRoot);
        }
      },
    },
    {
      ...ast.baseWalker,
      JSXElement: () => {},
    },
  );

  compileJsxValueExpressions(tree, context);
  const valueClass = context.needsMarkupWrapper ? `${helperPrefix}Value` : undefined;
  const childCalls = new Set(context.childNormalizerCalls);
  const components = new Set<E.ClassDeclaration>();
  let needsModuleNormalizer = false;
  let anonymousClasses = 0;
  // Bind each generated CallExpression to its containing class, e.g.
  // `$$wccChild(text)` -> `First.$$wccChild(text)` in First and `Second.$$wccChild(text)` in Second.
  // Class qualification also works inside `map(function (item) { ... })` with its own `this`.
  const bindNormalizers = (node: E.Node, component?: E.ClassDeclaration): void => {
    if (node.type === 'ClassDeclaration' && identifierName(node.superClass) === 'HTMLElement') {
      component = node;
    }
    if (node.type === 'CallExpression' && childCalls.has(node)) {
      if (component) {
        component.id ??= ast.createIdentifier(`${helperPrefix}Component${anonymousClasses++}`);
        node.callee = ast.createMemberExpression(
          ast.createIdentifier(component.id.name),
          context.childNormalizerName,
        );
        components.add(component);
      } else {
        needsModuleNormalizer = true;
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value))
        value.forEach((child) => {
          if (child?.type) bindNormalizers(child, component);
        });
      else if (value && typeof value === 'object' && 'type' in value)
        bindNormalizers(value as E.Node, component);
    }
  };
  bindNormalizers(tree);
  // Turn the shared function body into one MethodDefinition: `static $$wccChild(value) { ... }`.
  const normalizers = new Map<E.ClassDeclaration, E.MethodDefinition>();
  for (const component of components) {
    const reference = ast.createMemberExpression(
      ast.createIdentifier(component.id!.name),
      context.childNormalizerName,
    );
    const normalize = createJsxChildSerializer(context.childNormalizerName, valueClass, reference);
    normalizers.set(component, {
      type: 'MethodDefinition',
      key: ast.createIdentifier(context.childNormalizerName),
      value: { ...normalize, id: null },
      kind: 'method',
      computed: false,
      static: true,
    });
  }
  const declarations: E.Statement[] = [];
  if (valueClass) {
    declarations.push(
      ...(ast.parseModule(`
      class ${valueClass} {
        constructor(html) { this.html = html; }
        toString() { return this.html; }
      }
      function ${context.markupFunctionName}(html) { return new ${valueClass}(html); }
    `).body as E.Statement[]),
    );
  }
  // A module helper such as `const heading = text => <h3>{text}</h3>` has no owning class.
  // Its generated `$$wccChild(text)` calls share one module-level FunctionDeclaration.
  if (needsModuleNormalizer) {
    const normalize = createJsxChildSerializer(context.childNormalizerName, valueClass);
    declarations.push({
      ...normalize,
      type: 'FunctionDeclaration',
      id: ast.createIdentifier(context.childNormalizerName),
    });
  }
  tree.body.unshift(...declarations);

  // TODO: why does this compilation run twice?  logging here will output the message twice
  if (inferredObservability && observedAttributes.length > 0 && !hasOwnObservedAttributes) {
    // here we do the following with all the work we've done so far tracking attributes, signals, effects, etc
    // 1. setup static template functions and observed attributes that we've tracked so far to inject into the top of the class body
    // 2. append all effects to the end of the connectedCallback function
    // 3. setup cache references to all elements used in effects
    ast.walkSimple(
      tree,
      {
        ClassDeclaration(node) {
          if (
            node.id?.name === componentName &&
            node.type === 'ClassDeclaration' &&
            node.body.type === 'ClassBody'
          ) {
            // TODO: do we even need this filter?
            const trackingAttrs = observedAttributes.filter((attr) => typeof attr === 'string');
            const stateAttrs = trackingAttrs.filter(
              (attr) => constructorMembersSignals.get(attr)?.isState,
            );
            node.body.body.unshift(
              ...ast.createReactiveClassMembers(
                componentName,
                reactiveElements,
                stateAttrs,
                hasDisconnectedCallback,
              ),
            );
          }
        },
        MethodDefinition(node) {
          // append DOM references and effect functions for signals
          if (identifierName(node.key) === 'connectedCallback') {
            node.value.body.body.push(
              ...ast.createElementReferenceStatements(reactiveElements, hasShadowRoot),
              ...ast.createEffectStatements(reactiveElements),
            );
          }

          // append cleanup functions.if component already has a disconnectedCallback
          if (identifierName(node.key) === 'disconnectedCallback' && hasDisconnectedCallback) {
            node.value.body.body.push(...ast.createEffectCleanupStatements(reactiveElements));
          }
        },
      },
      {
        // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
        ...ast.baseWalker,
        JSXElement: () => {},
      },
    );

    // inject WCC's effect function
    tree.body.unshift(ast.createEffectImportDeclaration());
  }

  // Insert the MethodDefinition after the generated attribute parser:
  // `$el0; static parseAttribute = ...; static $$wccChild(value) { ... } attributeChangedCallback(...) { ... }`.
  for (const [component, normalize] of normalizers) {
    const parseAttributeIndex = component.body.body.findIndex(
      (member) =>
        member.type !== 'StaticBlock' &&
        member.static &&
        identifierName(member.key) === 'parseAttribute',
    );
    component.body.body.splice(parseAttributeIndex + 1, 0, normalize);
  }

  return tree;
}

// --------------

export function resolve(
  specifier: Parameters<ResolveHook>[0],
  context: Parameters<ResolveHook>[1],
  defaultResolve: Parameters<ResolveHook>[2],
): ReturnType<ResolveHook> {
  const { parentURL } = context;

  if (jsxRegex.test(specifier) || tsxRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href,
      shortCircuit: true,
    };
  }

  // Preserve the original hook forwarding, including its legacy third argument.
  return (defaultResolve as (...args: unknown[]) => ReturnType<typeof defaultResolve>)(
    specifier,
    context,
    defaultResolve,
  );
}

export async function load(
  url: Parameters<LoadHook>[0],
  context: Parameters<LoadHook>[1],
  defaultLoad: Parameters<LoadHook>[2],
): Promise<Awaited<ReturnType<LoadHook>>> {
  if (jsxRegex.test(url) || tsxRegex.test(url)) {
    const jsFromJsx = parseJsx(new URL(url));

    return {
      format: 'module',
      source: generate(jsFromJsx),
      shortCircuit: true,
    };
  }

  return (defaultLoad as (...args: unknown[]) => ReturnType<typeof defaultLoad>)(
    url,
    context,
    defaultLoad,
  );
}
