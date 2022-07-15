/* eslint-disable max-depth */
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import escodegen from 'escodegen';
import fs from 'fs/promises';
import jsx from 'acorn-jsx';
import { parse, parseFragment, serialize } from 'parse5';
import path from 'path';
import { URL, pathToFileURL } from 'url';

const baseURL = pathToFileURL(`${process.cwd()}/`).href;
const jsxRegex = /\.(jsx)$/;

// TODO same hack as definitions
let string;

// TODO move to a util
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

function parseJsxElement(element) {
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

            // onclick={this.count += 1}
            if (expression.type === 'AssignmentExpression') {
              const { left, right } = expression;

              if (left.object.type === 'ThisExpression') {
                if (left.property.type === 'Identifier') {
                  // very naive (fine grained?) reactivity
                  string += ` ${name}="__this__.${left.property.name}${expression.operator}${right.raw}; __this__.render();"`;
                }
              }
            }
          }
        } else {
          string += ` ${name}="${attribute.value.value}"`;
        }
      }

      string += '>';

      if (element.children.length > 0) {
        element.children.forEach(child => parseJsxElement(child, string));
      }

      string += `</${tagName}>`;
    }

    if (type === 'JSXText') {
      string += element.raw;
    }

    if (type === 'JSXExpressionContainer') {
      string += `\$\{${element.expression.name}\}`;
    }
  } catch (e) {
    console.error(e);
  }

  return string;
}

export async function parseJsx(moduleURL) {
  const moduleContents = await fs.readFile(moduleURL, 'utf-8');
  string = '';

  const tree = acorn.Parser.extend(jsx()).parse(moduleContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  });

  walk.simple(tree, {
    async ClassDeclaration(node) {
      if (node.superClass.name === 'HTMLElement') {
        const hasShadowRoot = moduleContents.slice(node.body.start, node.body.end).indexOf('this.attachShadow(') > 0;

        for (const n1 of node.body.body) {
          if (n1.type === 'MethodDefinition' && n1.key.name === 'render') {
            for (const n2 in n1.value.body.body) {
              const n = n1.value.body.body[n2];

              if (n.type === 'ReturnStatement' && n.argument.type === 'JSXElement') {
                const html = parseJsxElement(n.argument);
                const elementTree = getParse(html)(html);
                const elementRoot = hasShadowRoot ? 'this.shadowRoot' : 'this';

                applyDomDepthSubstitutions(elementTree, undefined, hasShadowRoot);

                const finalHtml = serialize(elementTree);
                const transformed = acorn.parse(`${elementRoot}.innerHTML = \`${finalHtml}\`;`, {
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
  }, {
    // https://github.com/acornjs/acorn/issues/829#issuecomment-1172586171
    ...walk.base,
    JSXElement: () => {}
  });

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
    const jsFromJsx = await parseJsx(new URL(url));

    return {
      format: 'module',
      source: escodegen.generate(jsFromJsx)
    };
  }

  return defaultLoad(url, context, defaultLoad);
}