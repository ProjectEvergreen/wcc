// this must come first
import { getParse } from './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { generate } from 'astring';
import { getParser, parseJsx } from './jsx-loader.js';
import { serialize } from 'parse5';
import { transform } from 'sucrase';
import fs from 'fs';

function isCustomElementDefinitionNode(node) {
  const { expression } = node;

  return expression.type === 'CallExpression' && expression.callee && expression.callee.object
    && expression.callee.property && expression.callee.object.name === 'customElements'
    && expression.callee.property.name === 'define';
}

async function renderComponentRoots(tree, definitions) {
  for (const node of tree.childNodes) {
    if (node.tagName && node.tagName.indexOf('-') > 0) {
      const { attrs, tagName } = node;

      if (definitions[tagName]) {
        const { moduleURL } = definitions[tagName];
        const elementInstance = await initializeCustomElement(moduleURL, tagName, node, definitions);

        if (elementInstance) {
          const hasShadow = elementInstance.shadowRoot;

          node.childNodes = hasShadow
            ? [...elementInstance.shadowRoot.childNodes, ...node.childNodes]
            : elementInstance.childNodes;
        } else {
          console.warn(`WARNING: customElement <${tagName}> detected but not serialized.  You may not have exported it.`);
        }
      } else {
        console.warn(`WARNING: customElement <${tagName}> is not defined.  You may not have imported it.`);
      }

      attrs.forEach((attr) => {
        if (attr.name === 'hydrate') {
          definitions[tagName].hydrate = attr.value;
        }
      });

    }

    if (node.childNodes && node.childNodes.length > 0) {
      await renderComponentRoots(node, definitions);
    }

    if (node.shadowRoot && node.shadowRoot.childNodes?.length > 0) {
      await renderComponentRoots(node.shadowRoot, definitions);
    }

    // does this only apply to `<template>` tags?
    if (node.content && node.content.childNodes?.length > 0) {
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

      if (typeof specifier === 'string') {
        const isBareSpecifier = specifier.indexOf('.') !== 0 && specifier.indexOf('/') !== 0;
        const extension = typeof specifier === "string" ? specifier.split('.').pop() : "";

        // would like to decouple .jsx from the core, ideally
        // https://github.com/ProjectEvergreen/wcc/issues/122
        if (!isBareSpecifier && ['js', 'jsx', 'ts'].includes(extension)) {
          const dependencyModuleURL = new URL(specifier, moduleURL);

          registerDependencies(dependencyModuleURL, definitions, nextDepth);
        }
      }
    },
    ExpressionStatement(node) {
      if (isCustomElementDefinitionNode(node)) {
        // @ts-ignore
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
        // @ts-ignore
        tagName = node.expression.arguments[0].value;
      }
    }
  }, config);

  return tagName;
}

async function initializeCustomElement(elementURL, tagName, node = {}, definitions = {}, isEntry, props = {}) {

  if (!tagName) {
    const depth = isEntry ? 1 : 0;
    registerDependencies(elementURL, definitions, depth);
  }

  const element = customElements.get(tagName) ?? (await import(elementURL)).default;
  const dataLoader = (await import(elementURL)).getData;
  const data = props ? props : dataLoader ? await dataLoader(props) : {};

  if (element) {
    const elementInstance = new element(data);

    Object.assign(elementInstance, node);

    await elementInstance.connectedCallback();

    return elementInstance;
  }
}

/** @type {import('./index.d.ts').renderToString} */
async function renderToString(elementURL, wrappingEntryTag = true, props = {}) {
  /** @type {import('./index.d.ts').Metadata} */
  const definitions = {};
  const elementTagName = wrappingEntryTag && await getTagName(elementURL);
  const isEntry = !!elementTagName;
  const elementInstance = await initializeCustomElement(elementURL, undefined, undefined, definitions, isEntry, props);

  let html;

  // in case the entry point isn't valid
  if (elementInstance) {
    elementInstance.nodeName = elementTagName ?? '';
    elementInstance.tagName = elementTagName ?? '';

    await renderComponentRoots(
      elementInstance.shadowRoot
        ? 
        { 
          nodeName: '#document-fragment', 
          childNodes: [elementInstance] 
        }
        : elementInstance,
      definitions
    );

    html = wrappingEntryTag && elementTagName ? `
        <${elementTagName}>
          ${serialize(elementInstance)}
        </${elementTagName}>
      `
      : serialize(elementInstance);
  } else {
    console.warn('WARNING: No custom element class found for this entry point.');
  }

  return {
    html,
    metadata: definitions
  };
}

/** @type {import('./index.d.ts').renderFromHTML} */
async function renderFromHTML(html, elements = []) {
  /** @type {import('./index.d.ts').Metadata} */
  const definitions = {};

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