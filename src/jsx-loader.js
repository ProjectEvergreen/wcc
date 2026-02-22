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
import { parse, parseFragment, serialize } from 'parse5';
import { transform } from 'sucrase';

// Signal has to come before effect
import { Signal } from 'signal-polyfill';
globalThis.Signal = globalThis.Signal ?? Signal;

// no-op implementation for SSR
function effect() {}
globalThis.effect = globalThis.effect ?? effect;

const jsxRegex = /\.(jsx)$/;
const tsxRegex = /\.(tsx)$/;

// TODO: same hack as definitions
// https://github.com/ProjectEvergreen/wcc/discussions/74
let string;

// TODO: move to a util
// https://github.com/ProjectEvergreen/wcc/discussions/74
function getParse(html) {
  return html.indexOf('<html>') >= 0 || html.indexOf('<body>') >= 0 || html.indexOf('<head>') >= 0
    ? parse
    : parseFragment;
}

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

// replace all instances of __this__ marker with relative reference to the custom element parent node
function applyDomDepthSubstitutions(tree, currentDepth = 1, hasShadowRoot = false) {
  try {
    for (const node of tree.childNodes) {
      const attrs = node.attrs;

      // check for attributes
      // and swap out __this__ with depthful parentElement chain
      if (attrs && attrs.length > 0) {
        for (const attr in attrs) {
          const { value } = attrs[attr];

          if (value.indexOf('__this__.') >= 0) {
            const root = hasShadowRoot
              ? '.getRootNode().host'
              : `${'.parentElement'.repeat(currentDepth)}`;

            node.attrs[attr].value = value.replace(/__this__/g, `this${root}`);
          }
        }
      }

      // TODO: handle text nodes for __this__ references
      // https://github.com/ProjectEvergreen/wcc/issues/88

      if (node.childNodes && node.childNodes.length > 0) {
        applyDomDepthSubstitutions(node, currentDepth + 1, hasShadowRoot);
      }
    }
  } catch (e) {
    console.error(e);
  }

  return tree;
}

// TODO handle if / else statements
// https://github.com/ProjectEvergreen/wcc/issues/88
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
        // TODO: we are just blindly tracking anything here.
        // everything should ideally be mapped to actual this references, to create a strong chain of direct reactivity
        // instead of tracking any declaration as a derived tracking attr
        // for convenience here, we push the entire declaration here, instead of the name like for direct this references (see above)
        references.push(declaration);
      }
    });
  }

  return references;
}

function parseJsxElement(element, moduleContents = '', inferredObservability) {
  try {
    const { type } = element;

    if (type === 'JSXElement') {
      const { openingElement } = element;
      const { attributes } = openingElement;
      const tagName = openingElement.name.name;

      string += `<${tagName}`;

      for (const attribute of attributes) {
        const { name } = attribute.name;

        // handle events
        if (name.startsWith('on')) {
          const { value } = attribute;
          const { expression } = value;

          // onclick={this.increment}
          if (value.type === 'JSXExpressionContainer') {
            if (expression.type === 'MemberExpression') {
              if (expression.object.type === 'ThisExpression') {
                if (expression.property.type === 'Identifier') {
                  // we leave markers for `this` so we can replace it later while also NOT accidentally replacing
                  // legitimate uses of this that might be actual content / markup of the custom element
                  string += ` ${name}="__this__.${expression.property.name}()"`;
                }
              }
            }

            // onclick={() => this.deleteUser(user.id)}
            // TODO onclick={(e) => { this.deleteUser(user.id) }}
            // TODO onclick={(e) => { this.deleteUser(user.id) && this.logAction(user.id) }}
            // https://github.com/ProjectEvergreen/wcc/issues/88
            if (expression.type === 'ArrowFunctionExpression') {
              if (expression.body && expression.body.type === 'CallExpression') {
                const { start, end } = expression;
                string += ` ${name}="${moduleContents.slice(start, end).replace(/this./g, '__this__.').replace('() => ', '')}"`;
              }
            }

            if (expression.type === 'AssignmentExpression') {
              const { left, right } = expression;

              if (left.object.type === 'ThisExpression') {
                if (left.property.type === 'Identifier') {
                  // implicit reactivity using this.render
                  string += ` ${name}="__this__.${left.property.name}${expression.operator}${right.raw}; __this__.render();"`;
                }
              }
            }
          }
        } else if (attribute.name.type === 'JSXIdentifier') {
          if (attribute.value) {
            const expression = attribute?.value?.expression;
            if (attribute.value.type === 'Literal') {
              // xxx="yyy" >
              string += ` ${name}="${attribute.value.value}"`;
            } else if (
              expression &&
              inferredObservability &&
              attribute.value.type === 'JSXExpressionContainer' &&
              expression?.type === 'CallExpression' &&
              expression?.callee.type === 'MemberExpression' &&
              expression?.arguments &&
              expression?.callee?.property?.name === 'get'
            ) {
              // xxx={products.get().length} >
              // TODO: do we need to handle for set()?
              const { object, property } = expression.callee;

              if (object.type === 'MemberExpression' && object?.object.type === 'ThisExpression') {
                // The count is counter={this.count.get()}
                string += ` ${name}=$\{${object.property.name}.${property.name}()}`;
              } else if (object.type === 'Identifier') {
                // xxx={products.get().length} >
                string += ` ${name}=$\{${object.name}.${property.name}()}`;
              }
            } else if (attribute.value.type === 'JSXExpressionContainer') {
              // xxx={allTodos.length} >
              const { value } = attribute;
              const { expression } = value;
              const expressionType = expression.type;

              switch (expressionType) {
                case 'Literal':
                  string += ` ${name}=${expression.raw}`;
                  break;
                case 'Identifier':
                  string += ` ${name}=$\{${expression.name}}`;
                  break;
                case 'MemberExpression':
                  if (expression.object.type === 'Identifier') {
                    if (expression.property.type === 'Identifier') {
                      string += ` ${name}=$\{${expression.object.name}.${expression.property.name}}`;
                    }
                  }
                  break;
                default:
                  break;
              }
            }
          } else {
            // xxx >
            string += ` ${name}`;
          }
        }
      }

      string += openingElement.selfClosing ? ' />' : '>';

      if (element.children.length > 0) {
        element.children.forEach((child) =>
          parseJsxElement(child, moduleContents, inferredObservability),
        );
      }

      string += `</${tagName}>`;
    }

    if (type === 'JSXText') {
      string += element.raw;
    }

    if (type === 'JSXExpressionContainer') {
      const { type } = element.expression;

      if (
        inferredObservability &&
        type === 'CallExpression' &&
        element.expression.arguments &&
        element.expression?.callee?.type === 'MemberExpression' &&
        element.expression?.callee?.property?.name === 'get'
      ) {
        // TODO: handle this references
        // https://github.com/ProjectEvergreen/wcc/issues/88
        // TODO: do we need to handle for set()?
        const { object, property } = element.expression.callee;
        string += `$\{${object.name}.${property.name}()}`;
      } else if (type === 'Identifier') {
        // You have {count} TODOs left to complete
        string += `$\{${element.expression.name}}`;
      } else if (type === 'MemberExpression') {
        const { object } = element.expression.object;

        // You have {this.todos.length} Todos left to complete
        // https://github.com/ProjectEvergreen/wcc/issues/88
        if (object && object.type === 'ThisExpression') {
          // TODO ReferenceError: __this__ is not defined
          // string += `\$\{__this__.${element.expression.object.property.name}.${element.expression.property.name}\}`;
        } else {
          // const { todos } = this;
          // ....
          // You have {todos.length} Todos left to complete
          string += `$\{${element.expression.object.name}.${element.expression.property.name}}`;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  return string;
}

function generateEffectsForReactiveElement(reactiveElement, idx) {
  const { effect, attributes } = reactiveElement;
  let contents = '';

  if (reactiveElement.effect?.expression) {
    contents += `
      effect(() => {
        this.$el${idx}.textContent = ${effect.expression}
      });\n
    `;
  }

  if (attributes.length > 0) {
    const attributeUpdates = attributes
      .map((attr) => {
        return `this.$el${idx}.setAttribute('${attr.name}', this.${attr.value}.get())`;
      })
      .join('\n');

    contents += `
      effect(() => {
        ${attributeUpdates}
      });\n
    `;
  }

  return contents;
}

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
  let tree = acorn.Parser.extend(jsx()).parse(result.code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });
  string = '';

  // initial pass to get certain information before running JSX transformations (could we do this in one pass?)
  // 1. if `inferredObservability` is set
  // 2. get the name of the component class for `static` references
  // 3, track observed attributes from `this` references in the template
  // 4. track if Shadow DOM is being used
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
          hasShadowRoot =
            moduleContents.slice(node.body.start, node.body.end).indexOf('this.attachShadow(') > 0;

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
    console.log(
      'inferredObservability enabled, but no static observedAttributes defined. Adding observedAttributes for',
      observedAttributes,
    );

    // this scans for signals usage within the template and builds up a reactive list of templates + effects
    // (could this be done during the transformation pass instead of having to generate and re-parse the module again?)
    // - TODO: recursive scanning for nested components
    walk.simple(
      tree,
      {
        MethodDefinition(node) {
          if (node.key.name === 'render') {
            for (const n2 in node.value.body.body) {
              const n = node.value.body.body[n2];
              if (n.type === 'ReturnStatement' && n.argument.type === 'JSXElement') {
                const parentTag = n.argument.openingElement.name.name;
                console.log('ENTERING TEMPLATE AT =>', { parentTag });
                const children = [];

                for (const child of n.argument.children) {
                  // TODO: need to handle recursion
                  if (child.type === 'JSXText') {
                    // console.log('TEXT NODE', { child })
                    // TODO: track top level reactivity for text nodes?
                  } else if (child.type === 'JSXElement') {
                    const childTag = child.openingElement.name.name;
                    console.log('ENTERING CHILD ELEMENT', { childTag });

                    // TODO: I think we are only checking for State, I think we also need to handle Computeds (by themselves) here as well
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
                      if (!children[childTag]) {
                        children[childTag] = [];
                      }

                      children[childTag].push(childTag);
                      reactiveElements.push({
                        selector: `${parentTag} > ${childTag}:nth-of-type(${children[childTag].length})`,
                        template: {},
                        attributes: [],
                      });
                    }

                    if (hasReactiveTemplate) {
                      console.log('CHILD ELEMENT HAS TEXT CONTENT REACTIVITY', { childTag });
                      const signals = [];
                      let template = '';

                      for (const c of child.children) {
                        if (c.type === 'JSXText') {
                          template += c.value;
                        } else if (c.type === 'JSXExpressionContainer') {
                          // TODO: handle this references?
                          // https://github.com/ProjectEvergreen/wcc/issues/88
                          const { object } = c.expression.callee || {};
                          template += `$\{${object.name}}`;
                          signals.push(object.name);
                        }
                      }

                      if (template !== '' && signals.length > 0) {
                        const $$templ = `$$tmpl${reactiveElements.length - 1}`;
                        // TODO: need to handle runtime assumption here with `_wcc`
                        const staticTemplate = `static ${$$templ} = (${signals.join(',')}) => _wcc\`${template.trim()}\`;`;
                        // TODO: handle this references?
                        // https://www.github.com/ProjectEvergreen/wcc/issues/88
                        const expression = `${componentName}.${$$templ}(${signals.map((s) => `this.${s}.get()`).join(', ')});`;

                        reactiveElements[reactiveElements.length - 1].effect = {
                          template: staticTemplate,
                          expression,
                        };
                      }
                    }

                    if (hasReactiveAttributes) {
                      console.log(
                        'CHILD ELEMENT HAS ATTRIBUTE REACTIVITY',
                        child.openingElement.name.name,
                      );
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
                for (const n2 in n1.value.body.body) {
                  const n = n1.value.body.body[n2];

                  if (n.type === 'ReturnStatement' && n.argument.type === 'JSXElement') {
                    const html = parseJsxElement(n.argument, moduleContents, inferredObservability);
                    const elementTree = getParse(html)(html);
                    const elementRoot = hasShadowRoot ? 'this.shadowRoot' : 'this';

                    applyDomDepthSubstitutions(elementTree, undefined, hasShadowRoot);

                    const serializedHtml = serialize(elementTree);
                    // we have to Shadow DOM use cases here
                    // 1. No shadowRoot, so we attachShadow and append the template
                    // 2. If there is root from the attachShadow signal, so we just need to inject innerHTML, say in an htmx
                    // could / should we do something else instead of .innerHTML
                    // https://github.com/ProjectEvergreen/wcc/issues/138
                    const renderHandler = hasShadowRoot
                      ? `
                        const template = document.createElement('template');
                        template.innerHTML = \`${serializedHtml}\`;

                        if(!${elementRoot}) {
                          this.attachShadow({ mode: 'open' });
                          this.shadowRoot.appendChild(template.content.cloneNode(true));
                        } else {
                          this.shadowRoot.innerHTML = template.innerHTML;
                        }
                      `
                      : `${elementRoot}.innerHTML = \`${serializedHtml}\`;`;
                    const transformed = acorn.parse(renderHandler, {
                      ecmaVersion: 'latest',
                      sourceType: 'module',
                    });

                    // @ts-ignore
                    n1.value.body.body[n2] = transformed;
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

  // TODO: why does this compilation run twice?  logging here will output the message twice
  if (inferredObservability && observedAttributes.length > 0 && !hasOwnObservedAttributes) {
    console.log(
      'Adding static observedAttributes and attributeChangedCallback for inferredObservability',
      { reactiveElements },
    );

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

            console.log('effect', { reactiveElements });
            console.log('observedAttributes', trackingAttrs);

            // TODO: better way to determine value type, e,g. array, number, object, etc for `parseAttribute`?
            // have to wrap these `static` calls in a class here, otherwise we can't parse them standalone w/ acorn
            const staticContents = `
              class Stub {
                ${reactiveElements.map((el, idx) => `$el${idx};`).join('')}
                ${reactiveElements
                  .filter((el) => el.effect?.template)
                  .map((el) => el.effect.template)
                  .join('\n')}
                static get observedAttributes() {
                  return [${[...trackingAttrs]
                    .filter((attr) => constructorMembersSignals.get(attr)?.isState)
                    .map((attr) => `'${attr}'`)
                    .join()}]
                }
                static parseAttribute = (value) => value.charAt(0) === '{' || value.charAt(0) === '['
                  ? JSON.parse(value)
                  : !isNaN(value)
                    ? parseInt(value, 10)
                    : value === 'true' || value === 'false'
                      ? value === 'true' ? true : false
                      : value;
                attributeChangedCallback(name, oldValue, newValue) {
                  this[name].set(${componentName}.parseAttribute(newValue));
                }
              }
            `;

            const staticContentsTree = acorn.parse(staticContents, {
              ecmaVersion: 'latest',
              sourceType: 'module',
            });

            node.body.body.unshift(...staticContentsTree.body[0].body.body);
          }
        },
        MethodDefinition(node) {
          if (node.key.name === 'connectedCallback') {
            const root = hasShadowRoot ? 'this.shadowRoot' : 'this';
            const effectElements = reactiveElements
              .map((el, idx) => `this.$el${idx} = ${root}.querySelector('${el.selector}');`)
              .join('\n');
            const effectContents = reactiveElements
              .map((element, idx) => generateEffectsForReactiveElement(element, idx))
              .join('\n');

            const effectElementsTree = acorn.parse(effectElements, {
              ecmaVersion: 'latest',
              sourceType: 'module',
            });
            const effectContentsTree = acorn.parse(effectContents, {
              ecmaVersion: 'latest',
              sourceType: 'module',
            });

            node.value.body.body = [
              ...node.value.body.body,
              ...effectElementsTree.body,
              ...effectContentsTree.body,
            ];
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
