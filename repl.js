import './src/dom-shim.js';
import { transform } from 'sucrase';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { serialize } from 'parse5';

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
          tagName = node.expression.arguments[0].value;
        }
      },
    },
  );

  return tagName;
}

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
  elementURL,
  tagName,
  node = {},
  // definitions = {},
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

  const result = e.data[0] + e.data[1];
  const input = e.data[2];
  const props = e.data[3] ?? null;
  const wrappingEntryTag = true;

  const x = new HTMLElement();
  console.log({ input, x });

  let err;
  let html;

  try {
    const blobURL = URL.createObjectURL(new Blob([input], { type: 'application/javascript' }));
    const definitions = {};

    console.log({ blobURL });
    await import(blobURL);

    const tagName = await getTagName(input);
    console.log({ tagName });

    console.log('????', customElements.get(tagName));
    console.log(customElements.customElementsRegistry);

    definitions[tagName] = {
      moduleURL: blobURL,
    };

    const elementInstance = await initializeCustomElement(blobURL, tagName, {}, true, props);
    console.log({ elementInstance });

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

      console.log({ html });
    } else {
      console.warn('WARNING: No custom element class found for this entry point.');
    }
  } catch (e) {
    console.error(e);
    err = e;
  }

  if (err) {
    postMessage(err);
  } else if (isNaN(result)) {
    postMessage('Please write two numbers');
  } else {
    const workerResult = 'Result: ' + result;
    console.log('Worker: Posting message back to main script');
    postMessage({ workerResult, html });
  }
};
