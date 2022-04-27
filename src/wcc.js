// this must come first
import './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { parseFragment, serialize } from 'parse5';

import fs from 'node:fs/promises';

// TODO better data structure for deps and hydrate function?
const deps = [];
const hydrateFunctions = new Map();

async function renderComponentRoots(tree) {
  for (const node of tree.childNodes) {
    if (node.tagName && node.tagName.indexOf('-') > 0) {
      console.debug('WE HAVE A CUSTOM ELEMENT !!!!!!!!!!!!!!');

      // if there are no nodes / content, it is an "empty" tag, e.g. <wcc-header></wcc-header>
      // we can just get the declarative shadow root right away
      // TODO safeguard against non-declared custom elements, e.g. using <my-element></my-element> without actually import-ing it first
      // or else below destructuring will break
      if (node.childNodes.length === 0) {
        const { tagName } = node;
        const { moduleURL } = deps[tagName];
        const elementInstance = await initializeCustomElement(moduleURL, tagName, node.attrs);

        const shadowRootHtml = elementInstance.getInnerHTML({ includeShadowRoots: true });
        const shadowRootTree = parseFragment(shadowRootHtml);

        node.childNodes = shadowRootTree.childNodes;
      }

      // TODO handle inner content like text or <slot>
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

    // walk custom element class for internal methods to expose at runtime
    // for supporting hydration and lazy loading strategies
    async ClassDeclaration(node) {
      if (node.superClass.name === 'HTMLElement') {
        const name = node.id.name;

        // find __hydrate__ method
        node.body.body.forEach((n) => {
          if(n.type === 'MethodDefinition' && n.static && n.key.name === '__hydrate__') {
            const innerFunction = moduleContents.slice(n.start, n.end);
            hydrateFunctions[name] = innerFunction.replace('static __hydrate__', '');
          }
        })
      }
    },

    // walk import statements to find other custom element definitions
    async ImportDeclaration(node) {
      const dependencyModuleURL = new URL(node.source.value, moduleURL);

      await registerDependencies(dependencyModuleURL);
    },

    // find customElement.define calls and track relevant metadata
    async ExpressionStatement(node) {
      const { expression } = node;

      // TODO don't need to update if it already exists
      if (expression.type === 'CallExpression' && expression.callee && expression.callee.object 
        && expression.callee.property && expression.callee.object.name === 'customElements'
        && expression.callee.property.name === 'define') {
        
        const tagName = node.expression.arguments[0].value;

        deps[tagName] = {
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
      deps[tagName].hydrate = attr.value;
    }
  });

  await elementInstance.connectedCallback();

  return elementInstance;
}

async function renderToString(elementURL, fragment = true) {
  const elementInstance = await initializeCustomElement(elementURL);
  const elementHtml = elementInstance.getInnerHTML({ includeShadowRoots: false });
  const elementTree = parseFragment(elementHtml);
  const finalTree = await renderComponentRoots(elementTree);

  elementInstance.shadowRoot.innerHTML = serialize(finalTree);

  // link custom element definitions with their __hydrate__ function
  for(const f in hydrateFunctions) {
    for(const d in deps) {
      if(f === deps[d].instanceName) {
        deps[d].__hydrate__ = hydrateFunctions[f].replace(/\n/g, '')
      }
    };
  }

  return {
    html: elementInstance.getInnerHTML({ includeShadowRoots: fragment }),
    assets: deps
  };
}

// TODO renderToStream

export {
  renderToString
};