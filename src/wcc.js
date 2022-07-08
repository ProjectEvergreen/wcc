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

function parseJsxElement(element) {
  console.debug('parseJsxTree', { string });

  try {
    const { type } = element;

    if (type === 'JSXElement') {
      const { openingElement } = element;
      const { attributes } = openingElement;
      const tagName = openingElement.name.name;
      console.debug('### JSXElement', tagName);

      string += `<${tagName}`;

      for (const attribute of attributes) {
        const { name } = attribute.name;

        // handle events
        if (name.startsWith('on')) {
          const { value } = attribute;
          const { expression } = value;

          if (value.type === 'JSXExpressionContainer') {
            if (expression.type === 'MemberExpression') {
              if (expression.object.type === 'ThisExpression') {
                if (expression.property.type === 'Identifier') {
                  // we leave markers for "this" so we can replace later but NOT accidentally replacing
                  // legitimate uses of this that might be actual content / markup
                  string += ` ${name}="__this__.${expression.property.name}()"`;
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

  console.debug('===== 🌳 BEFORE 🌳 ======');
  console.debug({ tree });

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
        for (const n1 of node.body.body) {
          if (n1.type === 'MethodDefinition' && n1.key.name === 'render') {
            console.log('@@@ we have a render function!');

            for (const n in n1.value.body.body) {
              const n2 = n1.value.body.body[n];

              if (n2.type === 'ReturnStatement' && n2.argument.type === 'JSXElement') {
                console.debug('@@@@ JSX ELEMENT AHOY @@@@');
                
                // ✔️ 1. Convert JSX into an HTML string
                // ✔️ 1a. handle function reference event handler - onclick={this.increment} -> onclick="__this__.increment()"
                // 1b. convert expressions - {count} -> ${count}
                // 1c. find shadow root Y / N (scoped to the custom element!)
                // 2. Convert HTML string into HTML AST
                // 2a. find root (parentElement / parentNode) depth
                // 2a. find `this` references and replace with root depth (ONLY within attributes!!! don't want to break actual content)
                // 3. Convert HTML AST into HTML string
                // 4. Replace render return statement with innerHTML (with or without shadow)
                // 5. ???
                // 6. Profit
                // =========
                // 5. Other event cases (to verify)
                // 5a. member expression (needs an implicit rerender?) - onclick={this.count + 1}
                // 5b. arrow function  - onclick={() => ...}

                const html = parseJsxElement(n2.argument);
                console.debug({ html });

                // TODO is this good enough?
                // Probably not, what if there are multiple classes in the same file?
                const hasShadow = moduleContents.indexOf('this.attachShadow(') > 0;
                const root = hasShadow ? 'this.shadowRoot' : 'this';
                const rootEntry = hasShadow ? 'parentNode.host' : 'parentElement';

                // order matters
                const jsx = moduleContents.slice(n2.argument.openingElement.start, n2.argument.closingElement.end)
                  .replace(/\n/g, '')
                  .replace('onclick={this.increment}', 'onclick="this.increment()"') // TODO transform events
                  .replace('onclick={this.decrement}', 'onclick="this.decrement()"') // TODO transform events
                  .replace('onclick={this.count += 1}', 'onclick="this.count += 1; this.render();"') // TODO transform events
                  .replace(/this/g, `this.parentElement.${rootEntry}`) // transform references to this, notice difference between with and without shadow dom
                  .replace(/\{/, '${'); // TODO transform variable expressions

                const transformed = acorn.parse(`${root}.innerHTML = \`${jsx}\`;`, {
                  ecmaVersion: 'latest',
                  sourceType: 'module'
                });

                n1.value.body.body[n] = transformed;
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

  console.debug('===== 🌳 AFTER 🌳 ======');
  console.debug({ tree });
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