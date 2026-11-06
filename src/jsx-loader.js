// https://nodejs.org/api/esm.html#esm_loaders
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { generate } from 'astring';
import fs from 'fs';
// ideally we can eventually adopt an ESM compatible version of this plugin
// https://github.com/acornjs/acorn-jsx/issues/112
// @ts-ignore
// but it does have a default export?
import jsx from '@projectevergreen/acorn-jsx-esm';
import { transform } from 'sucrase';
import * as ast from './jsx-ast-utils.js';

// expose global Signal polyfill to SSR environment
import { Signal } from 'signal-polyfill';
globalThis.Signal = Signal;

const jsxRegex = /\.(jsx)$/;
const tsxRegex = /\.(tsx)$/;
const acornParseOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
};

// Provide the parser and walker configuration for `.jsx` and `.tsx` modules.
export function getParser(moduleURL) {
  const ext = moduleURL.pathname.split('.').pop();
  const isJSX = ext === 'jsx' || ext === 'tsx';

  if (!isJSX) {
    return;
  }

  return {
    parser: acorn.Parser.extend(jsx()),
    config: {
      // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
      ...walk.base,
      JSXElement: () => {},
    },
  };
}

// TODO: handle if / else statements
// https://github.com/ProjectEvergreen/wcc/issues/88
// Track component properties, e.g. `this.count = 0` or `const { count } = this`.
function findThisReferences(context, statement) {
  const references = [];
  const isRenderFunctionContext = context === 'render';
  const { expression, type } = statement;
  const isConstructorThisAssignment =
    context === 'constructor' &&
    type === 'ExpressionStatement' &&
    expression.type === 'AssignmentExpression' &&
    expression.left.object.type === 'ThisExpression';

  if (isConstructorThisAssignment) {
    // this.name = 'something'; // constructor
    references.push(expression.left.property.name);
  } else if (isRenderFunctionContext && type === 'VariableDeclaration') {
    statement.declarations.forEach((declaration) => {
      const { init, id } = declaration;

      if (init.object && init.object.type === 'ThisExpression') {
        // const { description } = this.todo;
        references.push(init.property.name);
      } else if (init.type === 'ThisExpression' && id && id.properties) {
        // const { id, description } = this;
        id.properties.forEach((property) => {
          references.push(property.key.name);
        });
      } else {
        // TODO: we are just blindly tracking anything here?
        // everything should ideally be mapped to actual this references, to create a strong chain of direct reactivity
        // instead of tracking any declaration as a derived tracking attr
        // for convenience here, we push the entire declaration here, instead of the name like for direct this references (see above)
        references.push(declaration);
      }
    });
  }

  return references;
}

// Create HTML nodes from JSX, e.g. `<p>{count}</p>` becomes an element with an interpolation marker.
function createHtmlTreeFromJsx(
  element,
  template,
  inferredObservability,
  hasShadowRoot = false,
  currentDepth = 1,
  parent = ast.createHtmlFragment(),
) {
  try {
    const { type } = element;

    if (type === 'JSXElement') {
      const { openingElement } = element;
      const node = ast.createHtmlElement(openingElement.name.name);

      ast.appendHtmlChild(parent, node);

      for (const attribute of openingElement.attributes) {
        const { name } = attribute.name;

        if (name.startsWith('on')) {
          const { value } = attribute;

          if (value.type === 'JSXExpressionContainer') {
            const { expression } = value;

            if (expression.type === 'ArrowFunctionExpression' && expression.body) {
              node.attrs.push(
                ast.createHtmlAttribute(
                  name,
                  template.handler(() =>
                    ast.generateInlineEventHandler(expression, currentDepth, hasShadowRoot),
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
        } else if (attribute.name.type === 'JSXIdentifier') {
          if (!attribute.value) {
            node.attrs.push(ast.createHtmlAttribute(name));
            continue;
          }
          const expression = attribute.value.expression;

          if (attribute.value.type === 'Literal') {
            node.attrs.push(...ast.createHtmlLiteralAttributes(name, attribute.value, true));
          } else if (
            expression &&
            inferredObservability &&
            attribute.value.type === 'JSXExpressionContainer' &&
            expression.type === 'CallExpression' &&
            expression.callee.type === 'MemberExpression' &&
            expression.arguments &&
            expression.callee.property?.name === 'get'
          ) {
            const { object, property } = expression.callee;
            if (object.type === 'MemberExpression' && object.object?.type === 'ThisExpression') {
              node.attrs.push(
                ast.createHtmlAttribute(
                  name,
                  template.expression(
                    ast.createCallExpression(
                      ast.createMemberExpression(
                        ast.createIdentifier(object.property.name),
                        property.name,
                      ),
                    ),
                  ),
                ),
              );
            } else if (object.type === 'Identifier') {
              node.attrs.push(
                ast.createHtmlAttribute(
                  name,
                  template.expression(
                    ast.createCallExpression(ast.createMemberExpression(object, property.name)),
                  ),
                ),
              );
            }
          } else if (attribute.value.type === 'JSXExpressionContainer') {
            switch (expression.type) {
              case 'Literal':
                node.attrs.push(...ast.createHtmlLiteralAttributes(name, expression));
                break;
              case 'Identifier':
                node.attrs.push(ast.createHtmlAttribute(name, template.expression(expression)));
                break;
              case 'MemberExpression':
                if (
                  expression.object.type === 'Identifier' &&
                  expression.property.type === 'Identifier'
                ) {
                  node.attrs.push(
                    ast.createHtmlAttribute(
                      name,
                      template.expression(
                        ast.createMemberExpression(expression.object, expression.property),
                      ),
                    ),
                  );
                }
                break;
              default:
                break;
            }
          }
        }
      }

      for (const child of element.children) {
        createHtmlTreeFromJsx(
          child,
          template,
          inferredObservability,
          hasShadowRoot,
          currentDepth + 1,
          node,
        );
      }

      // HTML treats </br> as another <br>; JSX br output includes both line-break nodes.
      // TODO: emit one break for JSX <br />; the extra node preserves the current compiler output.
      if (node.tagName === 'br') {
        ast.appendHtmlChild(parent, ast.createHtmlElement('br'));
      }
    }

    if (type === 'JSXText') {
      ast.appendHtmlChild(parent, ast.createHtmlTextNode(element.raw, parent.tagName));
    }

    if (type === 'JSXExpressionContainer') {
      const expression = element.expression;
      let value;

      if (
        inferredObservability &&
        expression.type === 'CallExpression' &&
        expression.arguments &&
        expression.callee?.type === 'MemberExpression' &&
        expression.callee.property?.name === 'get'
      ) {
        // TODO: handle this references
        // https://github.com/ProjectEvergreen/wcc/issues/88
        const { object, property } = expression.callee;
        // Direct component this references are unsupported.
        value = ast.createCallExpression(
          ast.createMemberExpression(
            ast.createIdentifier(object.name ?? 'undefined'),
            property.name,
          ),
        );
      } else if (expression.type === 'Identifier') {
        // You have {count} TODOs left to complete
        value = expression;
      } else if (expression.type === 'MemberExpression') {
        // You have {this.todos.length} Todos left to complete
        // https://github.com/ProjectEvergreen/wcc/issues/88
        // TODO: support component this references in JSX text member expressions
        if (expression.object.object?.type !== 'ThisExpression') {
          value = ast.createMemberExpression(
            ast.createIdentifier(expression.object.name ?? 'undefined'),
            ast.createIdentifier(expression.property.name ?? 'undefined'),
          );
        }
      }
      if (value) {
        ast.appendHtmlChild(
          parent,
          ast.createHtmlTextNode(template.expression(value), parent.tagName),
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
  return parent;
}

// Compile a JSX/TSX module into a JavaScript AST with render statements and inferred effects.
export function parseJsx(moduleURL) {
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
  let observedAttributes = [];
  let constructorMembersSignals = new Map();
  let reactiveElements = [];
  let componentName;
  let hasShadowRoot;
  let hasDisconnectedCallback;
  let tree = acorn.Parser.extend(jsx()).parse(result.code, acornParseOptions);

  // initial pass to get certain information before running JSX transformations (could we do this in one pass?)
  // 1. if `inferredObservability` is set
  // 2. get the name of the component class for `static` references
  // 3, track observed attributes from `this` references in the template
  // 4. track if Shadow DOM is being used
  // 5. track if disconnectedCallback is already defined
  walk.simple(
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
          // @ts-ignore
          if (declaration.declarations[0].id.name === 'inferredObservability') {
            // @ts-ignore
            inferredObservability = Boolean(node.declaration.declarations[0].init.raw);
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
        // @ts-ignore
        if (node.superClass.name === 'HTMLElement') {
          hasShadowRoot = false;

          walk.simple(
            node.body,
            {
              CallExpression(call) {
                if (
                  call.callee.type === 'MemberExpression' &&
                  !call.callee.computed &&
                  call.callee.object.type === 'ThisExpression' &&
                  call.callee.property.name === 'attachShadow'
                ) {
                  hasShadowRoot = true;
                }
              },
            },
            { ...walk.base, JSXElement: () => {} },
          );

          for (const n1 of node.body.body) {
            if (n1.type === 'MethodDefinition') {
              // @ts-ignore
              const nodeName = n1.key.name;
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
        if (node.kind === 'method' && node?.key.name === 'disconnectedCallback') {
          hasDisconnectedCallback = true;
        }

        // @ts-ignore
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
              n.expression.left.object.type === 'ThisExpression'
            ) {
              const { left, right } = n.expression;
              if (
                right.type === 'NewExpression' &&
                right.callee?.object?.type === 'Identifier' &&
                right.callee?.object?.name === 'Signal'
              ) {
                const name = left.property.name;
                const isState = right.callee?.property?.name === 'State';
                const isComputed = right.callee?.property?.name === 'Computed';

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
      ...walk.base,
      // @ts-ignore
      JSXElement: () => {},
    },
  );

  // we do this first to track reactivity usage before we transform the template and re-write its contents
  if (inferredObservability && observedAttributes.length > 0 && !hasOwnObservedAttributes) {
    // this scans for signals usage within the template and builds up a reactive list of templates + effects
    // TODO: recursive scanning for nested components
    // https://github.com/ProjectEvergreen/wcc/issues/256
    walk.simple(
      tree,
      {
        MethodDefinition(node) {
          if (node.key.name === 'render') {
            for (const n2 in node.value.body.body) {
              const n = node.value.body.body[n2];

              if (n.type === 'ReturnStatement' && n.argument.type === 'JSXElement') {
                const rootNode = n.argument;
                const parentTag = rootNode.openingElement.name.name;
                const children = [];
                const parentTemplate = ast.createTemplateLiteralParts();
                let parentHasReactiveTemplate;
                let parentHasReactiveAttributes;
                let parentSignals = [];

                for (const child of rootNode.children) {
                  if (child.type === 'JSXText') {
                    // TODO: track top level reactivity for text nodes?
                    // https://github.com/ProjectEvergreen/wcc/issues/256
                    parentTemplate.text(child.raw);
                  } else if (child.type === 'JSXExpressionContainer') {
                    if (
                      child.expression?.type === 'CallExpression' &&
                      child.expression?.callee?.type === 'MemberExpression' &&
                      child.expression?.callee?.property?.name === 'get'
                    ) {
                      const { object } = child.expression.callee || {};
                      parentTemplate.expression(ast.createIdentifier(object.name));
                      parentSignals.push(object.name);
                      parentHasReactiveTemplate = true;
                    }

                    parentHasReactiveAttributes = rootNode.openingElement.attributes.some(
                      (a) =>
                        a.value.type === 'JSXExpressionContainer' &&
                        a.value.expression?.type === 'CallExpression' &&
                        a.value.expression?.callee?.type === 'MemberExpression' &&
                        a.value.expression?.callee?.property?.name === 'get',
                    );
                  } else if (child.type === 'JSXElement') {
                    const childTag = child.openingElement.name.name;

                    // track children for determining correct effect selector
                    if (!children[childTag]) {
                      children[childTag] = [];
                    }
                    children[childTag].push(childTag);

                    // TODO: I think we are only checking for State, I think we also need to handle Computeds (by themselves) here as well
                    // TODO: should we filter the things that call .get() out against actual signals found in the constructor / JSX?
                    // https://github.com/ProjectEvergreen/wcc/issues/256
                    const hasReactiveTemplate = child.children.some(
                      (c) =>
                        c.type === 'JSXExpressionContainer' &&
                        c.expression?.type === 'CallExpression' &&
                        c.expression?.callee?.type === 'MemberExpression' &&
                        c.expression?.callee?.property?.name === 'get',
                    );
                    const hasReactiveAttributes = child.openingElement.attributes.some(
                      (a) =>
                        a.value.type === 'JSXExpressionContainer' &&
                        a.value.expression?.type === 'CallExpression' &&
                        a.value.expression?.callee?.type === 'MemberExpression' &&
                        a.value.expression?.callee?.property?.name === 'get',
                    );

                    if (hasReactiveTemplate || hasReactiveAttributes) {
                      reactiveElements.push({
                        selector: `${parentTag} > ${childTag}:nth-of-type(${children[childTag].length})`,
                        template: {},
                        attributes: [],
                      });
                    }

                    if (hasReactiveTemplate) {
                      const signals = [];
                      const template = ast.createTemplateLiteralParts();

                      for (const c of child.children) {
                        if (c.type === 'JSXText') {
                          template.text(c.value);
                        } else if (c.type === 'JSXExpressionContainer') {
                          // TODO: handle this references?
                          // https://github.com/ProjectEvergreen/wcc/issues/88
                          const { object } = c.expression.callee || {};
                          template.expression(ast.createIdentifier(object.name));
                          signals.push(object.name);
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
                        if (
                          attr.value.type === 'JSXExpressionContainer' &&
                          attr.value.expression?.type === 'CallExpression' &&
                          attr.value.expression?.callee?.type === 'MemberExpression' &&
                          attr.value.expression?.callee?.property?.name === 'get'
                        ) {
                          const isThisExpression =
                            attr.value.expression?.callee?.object?.object?.type ===
                            'ThisExpression';
                          const value = isThisExpression
                            ? attr.value.expression?.callee?.object?.property.name
                            : attr.value.expression?.callee?.object.name;

                          reactiveElements[reactiveElements.length - 1].attributes.push({
                            name: attr.name.name,
                            value,
                          });
                        }
                      }
                    }
                  }
                }

                if (parentHasReactiveTemplate) {
                  // TODO: handle this references?
                  // https://www.github.com/ProjectEvergreen/wcc/issues/88
                  reactiveElements.push({
                    selector: `${parentTag}:nth-of-type(1)`,
                    effect: ast.createReactiveTemplate(
                      `$$tmpl${reactiveElements.length}`,
                      parentSignals,
                      parentTemplate,
                      componentName,
                    ),
                    attributes: [],
                  });

                  if (parentHasReactiveAttributes) {
                    for (const attr of rootNode.openingElement.attributes) {
                      if (
                        attr.value.type === 'JSXExpressionContainer' &&
                        attr.value.expression?.type === 'CallExpression' &&
                        attr.value.expression?.callee?.type === 'MemberExpression' &&
                        attr.value.expression?.callee?.property?.name === 'get'
                      ) {
                        const isThisExpression =
                          attr.value.expression?.callee?.object?.object?.type === 'ThisExpression';
                        const value = isThisExpression
                          ? attr.value.expression?.callee?.object?.property.name
                          : attr.value.expression?.callee?.object.name;

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
        ...walk.base,
        // @ts-ignore
        JSXElement: () => {},
      },
    );
  }

  // apply all JSX transformations
  walk.simple(
    tree,
    {
      ClassDeclaration(node) {
        // @ts-ignore
        if (node.superClass.name === 'HTMLElement') {
          for (const n1 of node.body.body) {
            if (n1.type === 'MethodDefinition') {
              // @ts-ignore
              const nodeName = n1.key.name;
              if (nodeName === 'render') {
                n1.value.body.body = n1.value.body.body.flatMap((statement) => {
                  if (
                    statement.type !== 'ReturnStatement' ||
                    statement.argument.type !== 'JSXElement'
                  ) {
                    return [statement];
                  }
                  const template = ast.createHtmlTemplateLiteralBuilder(moduleContents);
                  const htmlTree = createHtmlTreeFromJsx(
                    statement.argument,
                    template,
                    inferredObservability,
                    hasShadowRoot,
                  );
                  return ast.createRenderStatements(template.build(htmlTree), hasShadowRoot);
                });
              }
            }
          }
        }
      },
    },
    {
      // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
      ...walk.base,
      // @ts-ignore
      JSXElement: () => {},
    },
  );

  // TODO: why does this compilation run twice?  logging here will output the message twice
  if (inferredObservability && observedAttributes.length > 0 && !hasOwnObservedAttributes) {
    // here we do the following with all the work we've done so far tracking attributes, signals, effects, etc
    // 1. setup static template functions and observed attributes that we've tracked so far to inject into the top of the class body
    // 2. append all effects to the end of the connectedCallback function
    // 3. setup cache references to all elements used in effects
    walk.simple(
      tree,
      {
        ClassDeclaration(node) {
          if (
            node.id.name === componentName &&
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
          if (node.key.name === 'connectedCallback') {
            node.value.body.body.push(
              ...ast.createElementReferenceStatements(reactiveElements, hasShadowRoot),
              ...ast.createEffectStatements(reactiveElements),
            );
          }

          // append cleanup functions.if component already has a disconnectedCallback
          if (node.key.name === 'disconnectedCallback' && hasDisconnectedCallback) {
            node.value.body.body.push(...ast.createEffectCleanupStatements(reactiveElements));
          }
        },
      },
      {
        // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
        ...walk.base,
        // @ts-ignore
        JSXElement: () => {},
      },
    );

    // inject WCC's effect function
    tree.body.unshift(ast.createEffectImportDeclaration());
  }

  return tree;
}

// --------------

export function resolve(specifier, context, defaultResolve) {
  const { parentURL } = context;

  if (jsxRegex.test(specifier) || tsxRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href,
      shortCircuit: true,
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (jsxRegex.test(url) || tsxRegex.test(url)) {
    const jsFromJsx = parseJsx(new URL(url));

    return {
      format: 'module',
      source: generate(jsFromJsx),
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
