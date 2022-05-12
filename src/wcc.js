// this must come first
import './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { parse, parseFragment, serialize } from 'parse5';

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

  const { lightMode = false } = options;
  const includeShadowRoots = !lightMode;

  const elementInstance = await initializeCustomElement(elementURL);
  const elementHtml = elementInstance.getInnerHTML({ includeShadowRoots });
  const elementTree = parseFragment(elementHtml);
  const finalTree = await renderComponentRoots(elementTree, includeShadowRoots);

  return {
    html: serialize(finalTree),
    metadata: definitions
  };
}

async function renderFromHTML(html, elements = [], options = {}) {
  definitions = [];

  const { lightMode = false } = options;
  const includeShadowRoots = !lightMode;

  for (const url of elements) {
    await initializeCustomElement(url);
  }

  const elementTree = parse(html);
  const finalTree = await renderComponentRoots(elementTree, includeShadowRoots);

  return {
    html: serialize(finalTree),
    metadata: definitions
  };
}

export {
  renderToString,
  renderFromHTML
};