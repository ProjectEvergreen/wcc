/* eslint-disable max-depth */
// this must come first
import './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import escodegen from 'escodegen';
import jsx from 'acorn-jsx';
import { parse, parseFragment, serialize } from 'parse5';
import fs from 'fs';
import path from 'path';

function getParse(html) {
  return html.indexOf('<html>') >= 0 || html.indexOf('<body>') >= 0 || html.indexOf('<head>') >= 0
    ? parse
    : parseFragment;
}

function isCustomElementDefinitionNode(node) {
  const { expression } = node;

  return expression.type === 'CallExpression' && expression.callee && expression.callee.object
    && expression.callee.property && expression.callee.object.name === 'customElements'
    && expression.callee.property.name === 'define';
}

async function renderComponentRoots(tree, definitions) {
  for (const node of tree.childNodes) {
    if (node.tagName && node.tagName.indexOf('-') > 0) {
      const { tagName } = node;

      if (definitions[tagName]) {
        const { moduleURL } = definitions[tagName];
        const elementInstance = await initializeCustomElement(moduleURL, tagName, node.attrs, definitions);
        const elementHtml = elementInstance.shadowRoot
          ? elementInstance.getInnerHTML({ includeShadowRoots: true })
          : elementInstance.innerHTML;
        const elementTree = parseFragment(elementHtml);

        node.childNodes = node.childNodes.length === 0
          ? elementTree.childNodes
          : [...elementTree.childNodes, ...node.childNodes];
      } else {
        console.warn(`WARNING: customElement <${tagName}> is not defined.  You may not have imported it yet.`);
      }
    }

    if (node.childNodes && node.childNodes.length > 0) {
      await renderComponentRoots(node, definitions);
    }

    // does this only apply to `<template>` tags?
    if (node.content && node.content.childNodes && node.content.childNodes.length > 0) {
      await renderComponentRoots(node.content, definitions);
    }
  }

  return tree;
}

function registerDependencies(moduleURL, definitions) {
  const moduleContents = fs.readFileSync(moduleURL, 'utf-8');

  walk.simple(acorn.parse(moduleContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }), {
    ImportDeclaration(node) {
      const specifier = node.source.value;
      const isBareSpecifier = specifier.indexOf('.') !== 0 && specifier.indexOf('/') !== 0;

      if (!isBareSpecifier) {
        const dependencyModuleURL = new URL(node.source.value, moduleURL);

        registerDependencies(dependencyModuleURL, definitions);
      }
    },
    ExpressionStatement(node) {
      if (isCustomElementDefinitionNode(node)) {
        const { arguments: args } = node.expression;
        const tagName = args[0].value;

        definitions[tagName] = {
          instanceName: args[1].name,
          moduleURL
        };
      }
    }
  })
}

async function getTagName(moduleURL) {
  const moduleContents = await fs.promises.readFile(moduleURL, 'utf-8');
  let tagName;

  walk.simple(acorn.parse(moduleContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }), {
    ExpressionStatement(node) {
      if (isCustomElementDefinitionNode(node)) {

        tagName = node.expression.arguments[0].value;
      }
    }
  })

  return tagName;
}

async function initializeCustomElement(elementURL, tagName, attrs = [], definitions = []) {
  registerDependencies(elementURL, definitions);

  // https://github.com/ProjectEvergreen/wcc/pull/67/files#r902061804
  const { pathname } = elementURL;

  // TODO handle for getTagName
  if (path.extname(pathname) === '.jsx') {
    console.debug('initializeCustomElement JSX detected for this element');
  } else {
    const element = tagName
      ? customElements.get(tagName)
      : (await import(pathname)).default;
    const dataLoader = (await import(pathname)).getData;
    const data = dataLoader ? await dataLoader() : {};
    const elementInstance = new element(data); // eslint-disable-line new-cap

    attrs.forEach((attr) => {
      elementInstance.setAttribute(attr.name, attr.value);

      if (attr.name === 'hydrate') {
        definitions[tagName].hydrate = attr.value;
      }
    });

    await elementInstance.connectedCallback();

    return elementInstance;
  }
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

            //  else if (attr.value.expression.type === 'ArrowExpression') {
            //   console.debug('ARROW EXPRESSION TODO');
            // }
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

async function parseJsx(moduleURL, definitions = []) {
  const moduleContents = await fs.readFile(moduleURL, 'utf-8');
  let tagName;

  const tree = acorn.Parser.extend(jsx()).parse(moduleContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  });

  walk.simple(tree, {
    async ExpressionStatement(node) {
      if (isCustomElementDefinitionNode(node)) {
        tagName = node.expression.arguments[0].value;

        if (!definitions[tagName]) {
          definitions[tagName] = {};
        }
      }
    },
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

  definitions[tagName].source = escodegen.generate(tree);
  definitions[tagName].url = moduleURL;

  console.debug(definitions[tagName].source);

  return tree;
}

async function renderToString(elementURL) {
  const definitions = [];

  const elementTagName = await getTagName(elementURL);
  const elementInstance = await initializeCustomElement(elementURL, undefined, undefined, definitions);

  const elementHtml = elementInstance.shadowRoot
    ? elementInstance.getInnerHTML({ includeShadowRoots: true })
    : elementInstance.innerHTML;
  const elementTree = getParse(elementHtml)(elementHtml);
  const finalTree = await renderComponentRoots(elementTree, definitions);
  const html = elementTagName ? `
      <${elementTagName}>
        ${serialize(finalTree)}
      </${elementTagName}>
    `
    : serialize(finalTree);

  return {
    html,
    metadata: definitions
  };
}

async function renderFromHTML(html, elements = []) {
  const definitions = [];

  for (const url of elements) {
    await initializeCustomElement(url, undefined, undefined, definitions);
  }

  const elementTree = getParse(html)(html);
  const finalTree = await renderComponentRoots(elementTree, definitions);

  return {
    html: serialize(finalTree),
    metadata: definitions
  };
}

export {
  renderToString,
  renderFromHTML
};