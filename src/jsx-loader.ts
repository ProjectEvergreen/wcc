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
  parent: H.ParentNode = ast.createHtmlFragment(),
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
        // Save `onclick={this.#increment}` as a callback AST. Its marker identifies the target
        // after parse5 applies HTML parsing rules; listener statements are emitted after mounting.
        if (value?.type === 'JSXExpressionContainer') {
          const { expression } = value;
          if (expression.type !== 'JSXEmptyExpression') {
            const marker = template.handler(name, expression);
            if (marker) node.attrs.push(ast.createHtmlAttribute(name, marker));
          }
        }
      } else if (!expression) {
        // A valueless attribute such as `<button disabled>` is serialized as a boolean attribute.
        node.attrs.push(ast.createHtmlAttribute(name));
      } else if (expression.type === 'Literal') {
        // Literal JSX values (e.g. `title="&amp;"` or `hidden={false}`) can be serialized now.
        node.attrs.push(
          ...ast.createHtmlLiteralAttributes(name, expression, value?.type === 'Literal'),
        );
      } else if (expression.type !== 'JSXEmptyExpression') {
        // Keep dynamic values such as `title={this.#label}` as AST for runtime interpolation and escaping.
        node.attrs.push(
          ast.createHtmlAttribute(name, template.expression(expression, 'attribute')),
        );
      }
    }

    if (!innerHtml) {
      for (const child of element.children) {
        createHtmlTreeFromJsx(child, template, node);
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
    ast.appendHtmlChild(
      parent,
      ast.createHtmlTextNode(
        template.expression(
          element.expression,
          html.hasUnescapedText(parentTag, true) ? 'raw' : 'text',
        ),
        parentTag,
      ),
    );
  }
  return parent;
}

// Compile a JSX/TSX module into a JavaScript AST with render statements and inferred effects.
// e.g. JSX `<p>{count}</p>` in render() becomes an assignment to `this.innerHTML`.
export function parseJsx(
  moduleURL: PathOrFileDescriptor,
): E.Program & { start: number; end: number } {
  const moduleContents = fs.readFileSync(moduleURL, 'utf-8');
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
  // Effects run outside render(), so private aliases must resolve back to their class members.
  // e.g. `const count = this.#count; <span>{count.get()}</span>` needs `this.#count.get()` in its effect.
  const privateSignals = new Map<string, E.Expression>();
  const privateSignalRead = (expression: E.CallExpression & { callee: E.MemberExpression }) => {
    const object = expression.callee.object;
    const reference = object.type === 'Identifier' ? privateSignals.get(object.name) : undefined;
    if (reference) {
      // An alias read such as `count.get()` becomes `this.#count.get()` when moved into an effect.
      return { ...expression, callee: { ...expression.callee, object: reference } };
    }
    // Direct `this.#count.get()` already has the right receiver; retain its PrivateIdentifier node.
    // Public reads use the existing name-based generation, e.g. `count` becomes `this.count.get()`.
    return object.type === 'MemberExpression' && object.property.type === 'PrivateIdentifier'
      ? expression
      : undefined;
  };
  let privateSignalIndex = 0;
  // e.g. `{this.#count.get()}` uses `$privateSignal0` as the static template's parameter,
  // while its caller passes the original `this.#count.get()` expression from instance scope.
  const signalReference = (
    expression: E.CallExpression & { callee: E.MemberExpression },
  ): ast.ReactiveSignal => {
    const object = expression.callee.object;
    // Both `count.get()` and `this.count.get()` need a parameter named `count` in the static template.
    let name = getSignalName(expression) ?? 'undefined';
    if (object.type === 'MemberExpression' && object.property.type === 'PrivateIdentifier') {
      // Private names cannot be template-function parameters. Use a generated parameter instead.
      name = `$privateSignal${privateSignalIndex++}`;
      while (moduleContents.includes(name)) name += '_';
    }
    return { name, expression: privateSignalRead(expression) };
  };
  let hasPrivateSignals = false;
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
                // Direct reads such as `<p>{this.#count.get()}</p>` need effects even without
                // a declaration such as `const count = this.#count` to trigger alias tracking.
                const findPrivateSignalReads = (value: unknown): void => {
                  if (!value || typeof value !== 'object') return;
                  const expression = value as E.Node;
                  if (
                    isSignalRead(expression) &&
                    expression.callee.object.type === 'MemberExpression' &&
                    expression.callee.object.property.type === 'PrivateIdentifier'
                  ) {
                    hasPrivateSignals = true;
                  }
                  for (const child of Object.values(value)) {
                    // JSX nodes are skipped by the general analysis walker, so inspect their expression
                    // containers here too, e.g. the read inside `<p title={this.#count.get()}>`.
                    if (Array.isArray(child)) child.forEach(findPrivateSignalReads);
                    else findPrivateSignalReads(child);
                  }
                };
                findPrivateSignalReads(n1.value.body);
                for (const n2 in n1.value.body.body) {
                  const n = n1.value.body.body[n2];

                  if (n.type === 'VariableDeclaration') {
                    // Save `const count = this.#count` for effect generation without adding
                    // the private field to public HTML attribute observation (`observedAttributes`).
                    for (const { id, init } of n.declarations) {
                      if (
                        id.type === 'Identifier' &&
                        init?.type === 'MemberExpression' &&
                        init.object.type === 'ThisExpression' &&
                        init.property.type === 'PrivateIdentifier'
                      ) {
                        privateSignals.set(id.name, init);
                      }
                    }
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
              // `this.count = new Signal.State(0)` can expose a public observed attribute.
              // `this.#count` is tracked separately for effects and must retain its private identity.
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

  // Analyze reads before replacing JSX with render statements. Private-only components still need
  // effects, e.g. `<p>{this.#count.get()}</p>`, even when observedAttributes has no public entries.
  if (
    inferredObservability &&
    (observedAttributes.length > 0 || privateSignals.size > 0 || hasPrivateSignals) &&
    !hasOwnObservedAttributes
  ) {
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
                const parentSignals: ast.ReactiveSignal[] = [];

                for (const child of rootNode.children) {
                  if (child.type === 'JSXText') {
                    // TODO: track top level reactivity for text nodes?
                    // https://github.com/ProjectEvergreen/wcc/issues/256
                    parentTemplate.text(ast.createHtmlTextNode(child.raw, parentTag).value);
                  } else if (child.type === 'JSXExpressionContainer') {
                    if (isSignalRead(child.expression)) {
                      const signal = signalReference(child.expression);
                      parentTemplate.expression(ast.createIdentifier(signal.name));
                      parentSignals.push(signal);
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
                      const signals: ast.ReactiveSignal[] = [];
                      const template = ast.createTemplateLiteralParts();

                      for (const c of child.children) {
                        if (c.type === 'JSXText') {
                          template.text(ast.createHtmlTextNode(c.raw, childTag).value);
                        } else if (
                          c.type === 'JSXExpressionContainer' &&
                          isSignalRead(c.expression)
                        ) {
                          const signal = signalReference(c.expression);
                          template.expression(ast.createIdentifier(signal.name));
                          signals.push(signal);
                        }
                      }

                      if (signals.length > 0) {
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
                            // Preserve `this.#count.get()` (including resolved aliases) instead of
                            // reconstructing a public read such as `this.count.get()` from its name.
                            expression: privateSignalRead(attr.value.expression),
                          });
                        }
                      }
                    }
                  }
                }

                if (parentHasReactiveTemplate || parentHasReactiveAttributes) {
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
                          expression: privateSignalRead(attr.value.expression),
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
          let eventInitializationField = 'evInitialized';
          while (moduleContents.includes(eventInitializationField)) eventInitializationField += '_';
          let needsEventInitializationField = false;
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
                  const htmlTree = createHtmlTreeFromJsx(statement.argument, template);
                  const renderTemplate = template.build(htmlTree);
                  const listeners = template.listeners(hasShadowRoot);
                  const reuseShadowRoot = hasShadowRoot && listeners.length > 0;
                  needsEventInitializationField ||= reuseShadowRoot;
                  // e.g. `return <button onclick={this.#increment}>` becomes an innerHTML
                  // assignment followed by its listener. The first Shadow DOM render reuses DSD
                  // nodes when present, while keeping local callback captures in render() scope.
                  return [
                    ...ast.createRenderStatements(
                      renderTemplate,
                      hasShadowRoot,
                      reuseShadowRoot ? eventInitializationField : undefined,
                    ),
                    ...listeners,
                  ];
                });
              }
            }
          }
          if (needsEventInitializationField) {
            node.body.body.unshift(ast.createEventInitializationField(eventInitializationField));
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

  // TODO: why does this compilation run twice?  logging here will output the message twice
  if (
    inferredObservability &&
    (observedAttributes.length > 0 || privateSignals.size > 0 || hasPrivateSignals) &&
    !hasOwnObservedAttributes
  ) {
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
            // Only public State fields become HTML inputs, e.g. `<my-counter count="3">`.
            // Computeds derive their values, and private signals are kept outside this attribute list.
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
