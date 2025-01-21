/* eslint-disable max-depth */
// this must come first
import { getParse } from './dom-shim.js';

import { generateParsedJsx } from './jsx-loader.js';
import { serialize } from 'parse5';
import fs from 'fs';

const processedModules = new Set();
const PARSE_FILE_TYPES = ['jsx', 'ts'];

async function renderComponentRoots(tree, definitions) {
  for (const node of tree.childNodes) {
    if (!node.tagName || node.tagName.indexOf('-') <= 0) {
      await processChildNodes(node, definitions);
      continue;
    }

    const { attrs, tagName } = node;
    if (definitions[tagName]) {
      await handleCustomElement(node, definitions);
    } else {
      console.warn(`WARNING: customElement <${tagName}> is not defined. You may not have imported it.`);
    }

    attrs.forEach((attr) => {
      if (attr.name === 'hydrate') {
        definitions[tagName].hydrate = attr.value;
      }
    });

    await processChildNodes(node, definitions);
  }

  return tree;
}

async function handleCustomElement(node, definitions) {
  const { tagName } = node;
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
}

async function processChildNodes(node, definitions) {
  if (node.childNodes?.length) {
    await renderComponentRoots(node, definitions);
  }
  if (node.shadowRoot?.childNodes?.length) {
    await renderComponentRoots(node.shadowRoot, definitions);
  }
  if (node.content?.childNodes?.length) {
    await renderComponentRoots(node.content, definitions);
  }
}

function registerDependencies(moduleURL, definitions, depth = 0) {
  if (processedModules.has(moduleURL.href)) {
    return;
  }

  processedModules.add(moduleURL.href);

  let moduleContents;

  try {
    moduleContents = fs.readFileSync(moduleURL, 'utf-8');
  } catch (error) {
    console.error(`Error reading file at ${moduleURL.href}:`, error);
    return;
  }
  
  const shouldTransformAndParse = PARSE_FILE_TYPES.includes(moduleURL.pathname.split('.').pop());
  const source = shouldTransformAndParse ? generateParsedJsx(moduleURL) : moduleContents;

  const customElementDefinitionFound = source.includes('customElements.define');

  let match;
  const nextDepth = depth + 1;

  const containsImport = moduleContents.includes('import');

  if (containsImport) {
    const importRegex = /import\s+(['"`])(.*?)\1/g;

    while ((match = importRegex.exec(source))) {
      const specifier = match[2];
      const isBareSpecifier = specifier.indexOf('.') !== 0 && specifier.indexOf('/') !== 0;
      const extension = specifier.split('.').pop();

      if (!isBareSpecifier && ['js', 'jsx', 'ts'].includes(extension)) {
        const dependencyModuleURL = new URL(specifier, moduleURL);
        registerDependencies(dependencyModuleURL, definitions, nextDepth);
      }
    }
  }

  if (customElementDefinitionFound) {
    const customElementRegex = /customElements\.define\s*\(\s*(['"`])([^'"`]+)\1\s*,/g;

    while ((match = customElementRegex.exec(source))) {
      const tagName = match[2];
      definitions[tagName] = {
        instanceName: tagName,
        moduleURL,
        source,
        url: moduleURL,
        isEntry: depth === 1
      };
    }
  }

  return moduleContents;
}

async function initializeCustomElement(elementURL, tagName, node = {}, definitions = [], props = {}) {

  if (!tagName) {
    const moduleContents = registerDependencies(elementURL, definitions);
    if (moduleContents) {
      tagName = getTagName(moduleContents);
    }
  }

  // https://github.com/ProjectEvergreen/wcc/pull/67/files#r902061804
  // https://github.com/ProjectEvergreen/wcc/pull/159
  const { href } = elementURL;
  const element = customElements.get(tagName) ?? (await import(href)).default;
  const dataLoader = (await import(href)).getData;
  const data = props ? props : dataLoader ? await dataLoader(props) : {};

  if (element) {
    const elementInstance = new element(data); // eslint-disable-line new-cap
    
    Object.assign(elementInstance, node);
    elementInstance.nodeName = tagName ?? '';
    elementInstance.tagName = tagName ?? '';

    await elementInstance.connectedCallback();

    return elementInstance;
  }
}

function getTagName(moduleContents) {
  if (!moduleContents) {
    return;
  }

  const regex = /customElements\.define\(\s*['"`]\s*([\w-]+)\s*['"`]/;
  const match = moduleContents.match(regex);

  return match ? match[1] : undefined;
}

async function renderToString(elementURL, wrappingEntryTag = true, props = {}) {
  const definitions = [];
  const elementInstance = await initializeCustomElement(elementURL, undefined, undefined, definitions, props);

  let html;

  // in case the entry point isn't valid
  if (elementInstance) {
    await renderComponentRoots(
      elementInstance.shadowRoot
        ? { nodeName: '#document-fragment', childNodes: [elementInstance] }
        : elementInstance,
      definitions
    );

    html =
      wrappingEntryTag && elementInstance.tagName
        ? `
        <${elementInstance.tagName}>
          ${serialize(elementInstance)}
        </${elementInstance.tagName}>
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

export { renderToString, renderFromHTML };