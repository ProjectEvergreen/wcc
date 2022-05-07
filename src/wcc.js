// this must come first
import './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { parseFragment, serialize } from 'parse5';

import fs from 'node:fs/promises';

let definitions;

async function renderComponentRoots(tree, includeShadowRoots = true) {
  for (const node of tree.childNodes) {
    if (node.tagName && node.tagName.indexOf('-') > 0) {
      const { tagName } = node;
      const { moduleURL } = definitions[tagName];
      const elementInstance = await initializeCustomElement(moduleURL, tagName, node.attrs);

      const shadowRootHtml = elementInstance.getInnerHTML({ includeShadowRoots });
      const shadowRootTree = parseFragment(shadowRootHtml);

      // TODO safeguard against non-declared custom elements, e.g. using <my-element></my-element>
      // without it actually import-ing it first, or else below destructuring will break
      node.childNodes = node.childNodes.length === 0 ? shadowRootTree.childNodes : [...shadowRootTree.childNodes, ...node.childNodes];
    }

    if (node.childNodes && node.childNodes.length > 0) {
      await renderComponentRoots(node, includeShadowRoots);
    }

    // does this only apply to `<template>` tags?
    if (node.content && node.content.childNodes && node.content.childNodes.length > 0) {
      await renderComponentRoots(node.content, includeShadowRoots);
    }
  }

  return tree;
}

async function registerDependencies(moduleURL) {
  const moduleContents = await fs.readFile(moduleURL, 'utf-8');

  walk.simple(acorn.parse(moduleContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }), {
    async ImportDeclaration(node) {
      const dependencyModuleURL = new URL(node.source.value, moduleURL);

      await registerDependencies(dependencyModuleURL);
    },
    async ExpressionStatement(node) {
      const { expression } = node;

      // TODO don't need to update if it already exists
      if (expression.type === 'CallExpression' && expression.callee && expression.callee.object 
        && expression.callee.property && expression.callee.object.name === 'customElements' 
        && expression.callee.property.name === 'define') {
        
        const tagName = node.expression.arguments[0].value;

        definitions[tagName] = {
          instanceName: node.expression.arguments[1].name,
          moduleURL
        };
      }
    }
  });
}

// TODO assumes top level component is using a default export
async function initializeCustomElement(elementURL, tagName, attrs = []) {
  await registerDependencies(elementURL);

  const element = tagName
    ? customElements.get(tagName)
    : (await import(elementURL)).default;
  const dataLoader = (await import(elementURL)).getData;
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

async function renderToString(elementURL, options = {}) {
  definitions = [];
  const { includeShadowRoots = true, unwrapTopLevelShadowRoot = false } = options;

  const elementInstance = await initializeCustomElement(elementURL);
  // invert includeShadowRoots at the top level to double `<template>` tag wrapping top level content
  // this is useful in conjunction with a WC used as a page, where we only want its content, not necessarily its template
  const elementHtml = elementInstance.getInnerHTML({ includeShadowRoots: unwrapTopLevelShadowRoot ? !unwrapTopLevelShadowRoot : unwrapTopLevelShadowRoot });
  const elementTree = parseFragment(elementHtml);
  const finalTree = await renderComponentRoots(elementTree, includeShadowRoots);

  elementInstance.shadowRoot.innerHTML = serialize(finalTree);

  return {
    html: elementInstance.getInnerHTML({ includeShadowRoots }),
    metadata: definitions
  };
}

// TODO renderToStream

export {
  renderToString
};