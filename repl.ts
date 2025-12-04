import './src/dom-shim.js';
import { transform } from 'sucrase';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { serialize } from 'parse5';

// @ts-expect-error
function isCustomElementDefinitionNode(node) {
  const { expression } = node;

  return (
    expression.type === 'CallExpression' &&
    expression.callee &&
    expression.callee.object &&
    expression.callee.property &&
    expression.callee.object.name === 'customElements' &&
    expression.callee.property.name === 'define'
  );
}

// @ts-expect-error
async function getTagName(moduleContents) {
  const result = transform(moduleContents, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'automatic',
    production: true,
  });
  let tagName;

  walk.simple(
    acorn.Parser.parse(result.code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    }),
    {
      ExpressionStatement(node) {
        if (isCustomElementDefinitionNode(node)) {
          // @ts-expect-error
          tagName = node.expression.arguments[0].value;
        }
      },
    },
  );

  return tagName;
}

// @ts-expect-error
async function renderComponentRoots(tree, definitions) {
  for (const node of tree.childNodes) {
    if (node.tagName && node.tagName.indexOf('-') > 0) {
      const { attrs, tagName } = node;

      if (definitions[tagName]) {
        const { moduleURL } = definitions[tagName];
        const elementInstance = await initializeCustomElement(
          moduleURL,
          tagName,
          node,
          definitions,
        );

        if (elementInstance) {
          const hasShadow = elementInstance.shadowRoot;

          node.childNodes = hasShadow
            ? [...elementInstance.shadowRoot.childNodes, ...node.childNodes]
            : elementInstance.childNodes;
        } else {
          console.warn(
            `WARNING: customElement <${tagName}> detected but not serialized.  You may not have exported it.`,
          );
        }
      } else {
        console.warn(
          `WARNING: customElement <${tagName}> is not defined.  You may not have imported it.`,
        );
      }

      // @ts-expect-error
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

async function initializeCustomElement(
  // @ts-expect-error
  elementURL,
  // @ts-expect-error
  tagName,
  node = {},
  // definitions = {}
  // @ts-expect-error,
  isEntry,
  props = {},
) {
  // if (!tagName) {
  //   const depth = isEntry ? 1 : 0;
  //   registerDependencies(elementURL, definitions, depth);
  // }

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

onmessage = async (e) => {
  console.log('Worker: Message received from main script', { e });
  const input = e.data[0];
  const props = e.data[1] ?? null;
  const wrappingEntryTag = true;

  let err;
  let html;

  try {
    const blobURL = URL.createObjectURL(new Blob([input], { type: 'application/javascript' }));
    const definitions = {};

    await import(blobURL);

    const tagName = await getTagName(input);

    // @ts-expect-error
    definitions[tagName] = {
      moduleURL: blobURL,
    };

    const elementInstance = await initializeCustomElement(blobURL, tagName, {}, true, props);

    // in case the entry point isn't valid
    if (elementInstance) {
      elementInstance.nodeName = tagName ?? '';
      elementInstance.tagName = tagName ?? '';

      await renderComponentRoots(
        elementInstance.shadowRoot
          ? {
              nodeName: '#document-fragment',
              childNodes: [elementInstance],
            }
          : elementInstance,
        definitions,
      );

      html =
        wrappingEntryTag && tagName
          ? `
          <${tagName}>
            ${serialize(elementInstance)}
          </${tagName}>
        `
          : serialize(elementInstance);
    } else {
      console.warn('WARNING: No custom element class found for this entry point.');
    }
  } catch (e) {
    console.error(e);
    err = e;
  }

  if (err) {
    postMessage(err);
  } else {
    console.log('Worker: Posting message back to main script', { html });
    postMessage({ html });
  }
};
