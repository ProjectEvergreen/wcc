// this must come first
import './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { parse, parseFragment, serialize } from 'parse5';
import fs from 'fs/promises';

let definitions;

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

async function renderComponentRoots(tree) {
  for (const node of tree.childNodes) {
    if (node.tagName && node.tagName.indexOf('-') > 0) {
      const { tagName } = node;
      const { moduleURL } = definitions[tagName];
      const elementInstance = await initializeCustomElement(moduleURL, tagName, node.attrs);
      const elementHtml = elementInstance.shadowRoot
        ? elementInstance.getInnerHTML({ includeShadowRoots: true })
        : elementInstance.innerHTML;
      const elementTree = parseFragment(elementHtml);

      node.childNodes = node.childNodes.length === 0
        ? elementTree.childNodes
        : [...elementTree.childNodes, ...node.childNodes];
    }

    if (node.childNodes && node.childNodes.length > 0) {
      await renderComponentRoots(node);
    }

    // does this only apply to `<template>` tags?
    if (node.content && node.content.childNodes && node.content.childNodes.length > 0) {
      await renderComponentRoots(node.content);
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
      const specifier = node.source.value;
      const isBareSpecifier = specifier.indexOf('.') !== 0 && specifier.indexOf('/') !== 0;

      if (!isBareSpecifier) {
        const dependencyModuleURL = new URL(node.source.value, moduleURL);

        await registerDependencies(dependencyModuleURL);
      }
    },
    async ExpressionStatement(node) {
      if (isCustomElementDefinitionNode(node)) {
        const { arguments: args } = node.expression;
        const tagName = args[0].value;

        definitions[tagName] = {
          instanceName: args[1].name,
          moduleURL
        };
      }
    }
  });
}

async function getTagName(moduleURL) {
  const moduleContents = await fs.readFile(moduleURL, 'utf-8');
  let tagName;

  walk.simple(acorn.parse(moduleContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }), {
    async ExpressionStatement(node) {
      if (isCustomElementDefinitionNode(node)) {

        tagName = node.expression.arguments[0].value;
      }
    }
  });

  return tagName;
}

async function initializeCustomElement(elementURL, tagName, attrs = []) {
  await registerDependencies(elementURL);

  const { pathname } = elementURL;
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

async function renderToString(elementURL) {
  definitions = [];

  const elementTagName = await getTagName(elementURL);
  const elementInstance = await initializeCustomElement(elementURL);

  const elementHtml = elementInstance.shadowRoot
    ? elementInstance.getInnerHTML({ includeShadowRoots: true })
    : elementInstance.innerHTML;
  const elementTree = getParse(elementHtml)(elementHtml);
  const finalTree = await renderComponentRoots(elementTree);
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
  definitions = [];

  for (const url of elements) {
    await initializeCustomElement(url);
  }

  const elementTree = getParse(html)(html);
  const finalTree = await renderComponentRoots(elementTree);

  return {
    html: serialize(finalTree),
    metadata: definitions
  };
}

export {
  renderToString,
  renderFromHTML
};