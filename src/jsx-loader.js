/* eslint-disable max-depth, complexity */
// https://nodejs.org/api/esm.html#esm_loaders
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import escodegen from 'escodegen';
import fs from 'fs';
import jsx from 'acorn-jsx';
import { parse, parseFragment, serialize } from 'parse5';

const jsxRegex = /\.(jsx)$/;

// TODO same hack as definitions
// https://github.com/ProjectEvergreen/wcc/discussions/74
let string;

// TODO move to a util
// https://github.com/ProjectEvergreen/wcc/discussions/74
function getParse(html) {
  return html.indexOf('<html>') >= 0 || html.indexOf('<body>') >= 0 || html.indexOf('<head>') >= 0
    ? parse
    : parseFragment;
}

export function getParser(moduleURL) {
  const isJSX = moduleURL.pathname.split('.').pop() === 'jsx';

  if (!isJSX) {
    return;
  }

  return {
    parser: acorn.Parser.extend(jsx()),
    config: {
      // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
      ...walk.base,
      JSXElement: () => {}
    }
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
            const root = hasShadowRoot ? '.getRootNode().host' : `${'.parentElement'.repeat(currentDepth)}`;

            node.attrs[attr].value = value.replace(/__this__/g, `this${root}`);
          }
        }
      }

      if (node.childNodes && node.childNodes.length > 0) {
        applyDomDepthSubstitutions(node, currentDepth + 1, hasShadowRoot);
      }
    }
  } catch (e) {
    console.error(e);
  }

  return tree;
}

function parseJsxElement(element, moduleContents = '') {
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
                  // very naive (fine grained?) reactivity
                  // string += ` ${name}="__this__.${left.property.name}${expression.operator}${right.raw}; __this__.update(\\'${left.property.name}\\', null, __this__.${left.property.name});"`;
                  string += ` ${name}="__this__.${left.property.name}${expression.operator}${right.raw}; __this__.setAttribute(\\'${left.property.name}\\', __this__.${left.property.name});"`;
                }
              }
            }
          }
        } else if (attribute.name.type === 'JSXIdentifier') {
          // TODO is there any difference between an attribute for an event handler vs a normal attribute?
          // Can all these be parsed using one function>
          if (attribute.value) {
            if (attribute.value.type === 'Literal') {
              // xxx="yyy" >
              string += ` ${name}="${attribute.value.value}"`;
            } else if (attribute.value.type === 'JSXExpressionContainer') {
              // xxx={allTodos.length} >
              const { value } = attribute;
              const { expression } = value;

              if (expression.type === 'Identifier') {
                string += ` ${name}=\$\{${expression.name}\}`;
              }

              if (expression.type === 'MemberExpression') {
                if (expression.object.type === 'Identifier') {
                  if (expression.property.type === 'Identifier') {
                    string += ` ${name}=\$\{${expression.object.name}.${expression.property.name}\}`;
                  }
                }
              }

              // TODO make sure this only applies to `this` references!
              string += ` data-wcc-${expression.name}="${name}" data-wcc-ins="attr"`;
            }
          } else {
            // xxx >
            string += ` ${name}`;
          }
        }
      }

      string += openingElement.selfClosing ? '/>' : '>';

      if (element.children.length > 0) {
        element.children.forEach(child => parseJsxElement(child, moduleContents));
      }

      string += `</${tagName}>`;
    }

    if (type === 'JSXText') {
      string += element.raw;
    }

    if (type === 'JSXExpressionContainer') {
      const { type } = element.expression;

      if (type === 'Identifier') {
        // You have {count} TODOs left to complete
        const { name } = element.expression;

        string = `${string.slice(0, string.lastIndexOf('>'))} data-wcc-${name}="\${this.${name}}" data-wcc-ins="text">`;
        // TODO be able to remove this extra data attribute 
        // string = `${string.slice(0, string.lastIndexOf('>'))} data-wcc-${name} data-wcc-ins="text">`;
        string += `\$\{${element.expression.name}\}`;
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
          string += `\$\{${element.expression.object.name}.${element.expression.property.name}\}`;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  return string;
}

// TODO handle if / else statements
// https://github.com/ProjectEvergreen/wcc/issues/88
function findThisReferences(context, statement) {
  const references = [];
  const isRenderFunctionContext = context === 'render';
  const { expression, type } = statement;
  const isConstructorThisAssignment = context === 'constructor'
    && type === 'ExpressionStatement'
    && expression.type === 'AssignmentExpression'
    && expression.left.object.type === 'ThisExpression';

  if (isConstructorThisAssignment) {
    // this.name = 'something'; // constructor
    references.push(expression.left.property.name);
  } else if (isRenderFunctionContext && type === 'VariableDeclaration') {
    statement.declarations.forEach(declaration => {
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
        // TODO we are just blindly tracking anything here.
        // everything should ideally be mapped to actual this references, to create a strong chain of direct reactivity
        // instead of tracking any declaration as a derived tracking attr
        // for convenience here, we push the entire declaration here, instead of the name like for direct this references (see above)
        references.push(declaration);
      }
    });
  }

  return references;
}

export function parseJsx(moduleURL) {
  const moduleContents = fs.readFileSync(moduleURL, 'utf-8');
  // would be nice if we could do this instead, so we could know ahead of time
  // const { inferredObservability } = await import(moduleURL);
  // however, this requires making parseJsx async, but WCC acorn walking is done sync
  const hasOwnObservedAttributes = undefined;
  let inferredObservability = false;
  let observedAttributes = [];
  let tree = acorn.Parser.extend(jsx()).parse(moduleContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  });
  string = '';

  walk.simple(tree, {
    ClassDeclaration(node) {
      if (node.superClass.name === 'HTMLElement') {
        const hasShadowRoot = moduleContents.slice(node.body.start, node.body.end).indexOf('this.attachShadow(') > 0;

        for (const n1 of node.body.body) {
          if (n1.type === 'MethodDefinition') {
            const nodeName = n1.key.name;
            if (nodeName === 'render') {
              for (const n2 in n1.value.body.body) {
                const n = n1.value.body.body[n2];

                if (n.type === 'VariableDeclaration') {
                  observedAttributes = [
                    ...observedAttributes,
                    ...findThisReferences('render', n)
                  ];
                } else if (n.type === 'ReturnStatement' && n.argument.type === 'JSXElement') {
                  const html = parseJsxElement(n.argument, moduleContents);
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
                    sourceType: 'module'
                  });

                  n1.value.body.body[n2] = transformed;
                }
              }
            }
          }
        }
      }
    },
    ExportNamedDeclaration(node) {
      const { declaration } = node;

      if (declaration && declaration.type === 'VariableDeclaration' && declaration.kind === 'const' && declaration.declarations.length === 1) {
        if (declaration.declarations[0].id.name === 'inferredObservability') {
          inferredObservability = Boolean(node.declaration.declarations[0].init.raw);
        }
      }
    }
  }, {
    // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
    ...walk.base,
    JSXElement: () => {}
  });

  // TODO - signals: use constructor, render, HTML attributes?  some, none, or all?
  if (inferredObservability && observedAttributes.length > 0 && !hasOwnObservedAttributes) {
    let insertPoint;
    for (const line of tree.body) {
      // test for class MyComponent vs export default class MyComponent
      if (line.type === 'ClassDeclaration' || (line.declaration && line.declaration.type) === 'ClassDeclaration') {
        insertPoint = line.declaration.body.start + 1;
      }
    }

    let newModuleContents = escodegen.generate(tree);
    const trackingAttrs = observedAttributes.filter(attr => typeof attr === 'string');
    // TODO ideally derivedAttrs would explicitely reference trackingAttrs
    // and if there are no derivedAttrs, do not include the derivedGetters / derivedSetters code in the compiled output
    const derivedAttrs = observedAttributes.filter(attr => typeof attr !== 'string');
    const derivedGetters = derivedAttrs.map(attr => {
      return `
        get_${attr.id.name}(${trackingAttrs.join(',')}) {
          console.log('@@@@@@@@@@@@@@@@@@@@ updating derivative value for => ${attr.id.name}');
          console.log('@@@@@@@@@@@@@@@@@@@@ new derivative value is =>', ${moduleContents.slice(attr.init.start, attr.init.end)});
          return ${moduleContents.slice(attr.init.start, attr.init.end)}
        }
      `;
    }).join('\n');
    const derivedSetters = derivedAttrs.map(attr => {
      const name = attr.id.name;

      return `
        const old_${name} = this.get_${name}(oldValue);
        const new_${name} = this.get_${name}(newValue);
        this.update('${name}', old_${name}, new_${name});
      `;
    }).join('\n');

    // TODO better way to determine value type?
    /* eslint-disable indent */
    newModuleContents = `${newModuleContents.slice(0, insertPoint)}
      static get observedAttributes() {
        return [${[...trackingAttrs].map(attr => `'${attr}'`).join()}]
      }

      attributeChangedCallback(name, oldValue, newValue) {
        console.debug('???attributeChangedCallback', { name });
        console.debug('???attributeChangedCallback', { oldValue });
        console.debug('???attributeChangedCallback', { newValue });
        function getValue(value) {
          return value.charAt(0) === '{' || value.charAt(0) === '['
            ? JSON.parse(value)
            : !isNaN(value)
              ? parseInt(value, 10)
              : value === 'true' || value === 'false'
                ? value === 'true' ? true : false
                : value;
        }
        if (newValue !== oldValue) {
          switch(name) {
            ${trackingAttrs.map((attr) => {
              return `
                case '${attr}':
                  this.${attr} = getValue(newValue);
                  break;
              `;
            }).join('\n')}
          }
          this.update(name, oldValue, newValue);
        }
      }

      update(name, oldValue, newValue) {
        console.debug('Update tracking against....', this.constructor.observedAttributes);
        console.debug('Updating', name);
        console.debug('Swap old', oldValue);
        console.debug('For new', newValue);
        console.debug('this[name]', this[name]);
        const attr = \`data-wcc-\${name}\`;
        const selector = \`[\${attr}]\`;
        console.debug({ attr });
        console.debug({ selector });

        this.querySelectorAll(selector).forEach((el) => {
          const needle = oldValue || el.getAttribute(attr);
          console.debug({ el })
          console.debug({ needle });
          console.debug({ newValue });
          switch(el.getAttribute('data-wcc-ins')) {
            case 'text':
              el.textContent = el.textContent.replace(needle, newValue);
              break;
            case 'attr':
              if (el.hasAttribute(el.getAttribute(attr))) {
                el.setAttribute(el.getAttribute(attr), newValue);
              }
              break;
          }
        })

        if ([${[...trackingAttrs].map(attr => `'${attr}'`).join()}].includes(name)) {
          ${derivedSetters}
        }
        console.debug('****************************');
      }

      ${derivedGetters}

      ${newModuleContents.slice(insertPoint)}
    `;
    /* eslint-enable indent */

    tree = acorn.Parser.extend(jsx()).parse(newModuleContents, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    });
  }

  return tree;
}

// --------------

export function resolve(specifier, context, defaultResolve) {
  const { parentURL } = context;

  if (jsxRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href,
      shortCircuit: true
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (jsxRegex.test(url)) {
    const jsFromJsx = parseJsx(new URL(url));

    return {
      format: 'module',
      source: escodegen.generate(jsFromJsx),
      shortCircuit: true
    };
  }

  return defaultLoad(url, context, defaultLoad);
}