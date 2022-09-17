/* eslint-disable max-depth, complexity */
// https://nodejs.org/api/esm.html#esm_loaders
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import escodegen from 'escodegen';
import fs from 'fs';
import jsx from 'acorn-jsx';
import { parse, parseFragment, serialize } from 'parse5';
import path from 'path';
import { URL, pathToFileURL } from 'url';

const baseURL = pathToFileURL(`${process.cwd()}/`).href;
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
  const isJSX = path.extname(moduleURL.pathname) === '.jsx';

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
            const root = hasShadowRoot ? 'parentNode.host' : 'parentElement';

            node.attrs[attr].value = value.replace(/__this__/g, `this${'.parentElement'.repeat(currentDepth - 1)}.${root}`);
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
        // const { description } = this.todo;
        id.properties.forEach((property) => {
          references.push(property.key.name);
        });
      }
    });
  }

  return references;
}

export function parseJsx(moduleURL) {
  const moduleContents = fs.readFileSync(moduleURL, 'utf-8');
  const hasOwnObservedAttributes = undefined;
  const observedAttributes = {
    constructor: [],
    render: []
  };
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
            if (nodeName === 'constructor') {
              n1.value.body.body.forEach((statement) => {
                observedAttributes.constructor = [
                  ...observedAttributes.constructor,
                  ...findThisReferences('constructor', statement)
                ];
              });
            } else if (nodeName === 'render') {
              for (const n2 in n1.value.body.body) {
                const n = n1.value.body.body[n2];

                if (n.type === 'VariableDeclaration') {
                  observedAttributes.render = [
                    ...observedAttributes.render,
                    ...findThisReferences('render', n)
                  ];
                } else if (n.type === 'ReturnStatement' && n.argument.type === 'JSXElement') {
                  const html = parseJsxElement(n.argument, moduleContents);
                  const elementTree = getParse(html)(html);
                  const elementRoot = hasShadowRoot ? 'this.shadowRoot' : 'this';

                  applyDomDepthSubstitutions(elementTree, undefined, hasShadowRoot);

                  const finalHtml = serialize(elementTree);
                  const transformed = acorn.parse(`${elementRoot}.template = '${finalHtml.replace(/\n/g, '')}';${elementRoot}.innerHTML = \`${finalHtml}\`;`, {
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
    }
  }, {
    // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
    ...walk.base,
    JSXElement: () => {}
  });

  // TODO - signals: use constructor, render, HTML attributes?  some, none, or all?
  if (observedAttributes.constructor.length > 0 && !hasOwnObservedAttributes) {
    let insertPoint;
    for (const line of tree.body) {
      // test for class MyComponent vs export default class MyComponent
      if (line.type === 'ClassDeclaration' || (line.declaration && line.declaration.type) === 'ClassDeclaration') {
        const children = !line.declaration
          ? line.body.body
          : line.declaration.body.body;
        for (const method of children) {
          if (method.key.name === 'constructor') {
            insertPoint = method.start - 1;
            break;
          }
        }
      }
    }

    let newModuleContents = escodegen.generate(tree);

    // TODO better way to determine value type?
    /* eslint-disable indent */
    newModuleContents = `${newModuleContents.slice(0, insertPoint)}
      static get observedAttributes() {
        return [${[...observedAttributes.constructor].map(attr => `'${attr}'`).join(',')}]
      }

      attributeChangedCallback(name, oldValue, newValue) {
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
            ${observedAttributes.constructor.map((attr) => {
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
        const attr = \`data-wcc-\${name}\`;
        const selector = \`[\${attr}]\`;

        this.querySelectorAll(selector).forEach((el) => {
          const needle = oldValue || el.getAttribute(attr);
          switch(el.getAttribute('data-wcc-ins')) {
            case 'text':
              el.textContent = el.textContent.replace(needle, newValue);
              break;
          }
        })
      }

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
  const { parentURL = baseURL } = context;

  if (jsxRegex.test(specifier)) {
    return {
      url: new URL(specifier, parentURL).href
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (jsxRegex.test(url)) {
    const jsFromJsx = parseJsx(new URL(url));

    return {
      format: 'module',
      source: escodegen.generate(jsFromJsx)
    };
  }

  return defaultLoad(url, context, defaultLoad);
}