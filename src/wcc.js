/* eslint-disable max-depth */
// this must come first
import './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { generate } from 'astring';
import { getParser, parseJsx } from './jsx-loader.js';
import { parse, parseFragment, serialize } from 'parse5';
import { transform } from 'sucrase';
import fs from 'fs';

// https://developer.mozilla.org/en-US/docs/Glossary/Void_element
const VOID_ELEMENTS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param', // deprecated
  'source',
  'track',
  'wbr'
];

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
        const elementInstance = await initializeCustomElement(moduleURL, tagName, node, definitions);

        if (elementInstance) {
          const hasShadow = elementInstance.shadowRoot;
          const elementHtml = hasShadow
            ? elementInstance.getHTML({ serializableShadowRoots: true })
            : elementInstance.innerHTML;
          const elementTree = parseFragment(elementHtml);
          const hasLight = elementTree.childNodes > 0;

          node.childNodes = node.childNodes.length === 0 && hasLight && !hasShadow
            ? elementTree.childNodes
            : hasShadow
              ? [...elementTree.childNodes, ...node.childNodes]
              : elementTree.childNodes;
        } else {
          console.warn(`WARNING: customElement <${tagName}> detected but not serialized.  You may not have exported it.`);
        }
      } else {
        console.warn(`WARNING: customElement <${tagName}> is not defined.  You may not have imported it.`);
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

function registerDependencies(moduleURL, definitions, depth = 0) {
  const moduleContents = fs.readFileSync(moduleURL, 'utf-8');
  const result = transform(moduleContents, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'preserve'
  });
  const nextDepth = depth += 1;
  const customParser = getParser(moduleURL);
  const parser = customParser ? customParser.parser : acorn.Parser;
  const config = customParser ? customParser.config : {
    ...walk.base
  };

  walk.simple(parser.parse(result.code, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }), {
    ImportDeclaration(node) {
      const specifier = node.source.value;
      const isBareSpecifier = specifier.indexOf('.') !== 0 && specifier.indexOf('/') !== 0;
      const extension = specifier.split('.').pop();

      // would like to decouple .jsx from the core, ideally
      // https://github.com/ProjectEvergreen/wcc/issues/122
      if (!isBareSpecifier && ['js', 'jsx', 'ts'].includes(extension)) {
        const dependencyModuleURL = new URL(node.source.value, moduleURL);

        registerDependencies(dependencyModuleURL, definitions, nextDepth);
      }
    },
    ExpressionStatement(node) {
      if (isCustomElementDefinitionNode(node)) {
        const { arguments: args } = node.expression;
        const tagName = args[0].type === 'Literal'
          ? args[0].value // single and double quotes
          : args[0].quasis[0].value.raw; // template literal
        const tree = parseJsx(moduleURL);
        const isEntry = nextDepth - 1 === 1;

        definitions[tagName] = {
          instanceName: args[1].name,
          moduleURL,
          source: generate(tree),
          url: moduleURL,
          isEntry
        };
      }
    }
  }, config);
}

async function getTagName(moduleURL) {
  const moduleContents = await fs.promises.readFile(moduleURL, 'utf-8');
  const result = transform(moduleContents, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'preserve'
  });
  const customParser = getParser(moduleURL);
  const parser = customParser ? customParser.parser : acorn.Parser;
  const config = customParser ? customParser.config : {
    ...walk.base
  };
  let tagName;

  walk.simple(parser.parse(result.code, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }), {
    ExpressionStatement(node) {
      if (isCustomElementDefinitionNode(node)) {
        tagName = node.expression.arguments[0].value;
      }
    }
  }, config);

  return tagName;
}

function renderLightDomChildren(childNodes, iHTML = '') {
  let innerHTML = iHTML;

  childNodes.forEach((child) => {
    const { nodeName, attrs = [], value } = child;

    if (nodeName !== '#text') {
      innerHTML += `<${nodeName}`;

      if (attrs.length > 0) {
        attrs.forEach(attr => {
          innerHTML += ` ${attr.name}="${attr.value}"`;
        });
      }

      innerHTML += '>';

      if (child.childNodes.length > 0) {
        innerHTML = renderLightDomChildren(child.childNodes, innerHTML);
      }

      innerHTML += VOID_ELEMENTS.includes(nodeName)
        ? ''
        : `</${nodeName}>`;
    } else if (nodeName === '#text') {
      innerHTML += value;
    }
  });

  return innerHTML;
}

async function initializeCustomElement(elementURL, tagName, node = {}, definitions = [], isEntry, props = {}) {
  const { attrs = [], childNodes = [] } = node;

  if (!tagName) {
    const depth = isEntry ? 1 : 0;
    registerDependencies(elementURL, definitions, depth);
  }

  // https://github.com/ProjectEvergreen/wcc/pull/67/files#r902061804
  // https://github.com/ProjectEvergreen/wcc/pull/159
  const { href } = elementURL;
  const element = customElements.get(tagName) ?? (await import(href)).default;
  const dataLoader = (await import(href)).getData;
  const data = props
    ? props
    : dataLoader
      ? await dataLoader(props)
      : {};

  if (element) {
    const elementInstance = new element(data); // eslint-disable-line new-cap

    // support for HTML (Light DOM) Web Components
    elementInstance.innerHTML = renderLightDomChildren(childNodes);

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

async function renderToString(elementURL, wrappingEntryTag = true, props = {}) {
  const definitions = [];
  const elementTagName = wrappingEntryTag && await getTagName(elementURL);
  const isEntry = !!elementTagName;
  const elementInstance = await initializeCustomElement(elementURL, undefined, undefined, definitions, isEntry, props);
  let html;

  // in case the entry point isn't valid
  if (elementInstance) {
    const elementHtml = elementInstance.shadowRoot
      ? elementInstance.getHTML({ serializableShadowRoots: true })
      : elementInstance.innerHTML;
    const elementTree = getParse(elementHtml)(elementHtml);
    const finalTree = await renderComponentRoots(elementTree, definitions);

    html = wrappingEntryTag && elementTagName ? `
        <${elementTagName}>
          ${serialize(finalTree)}
        </${elementTagName}>
      `
      : serialize(finalTree);
  } else {
    console.warn('WARNING: No custom element class found for this entry point.');
  }

  return {
    html,
    metadata: definitions
  };
}

async function renderFromHTML(html, elements = []) {
  const definitions = [];

  for (const url of elements) {
    registerDependencies(url, definitions, 1);
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