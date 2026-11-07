// this must come first
import { getParse } from './dom-shim.js';
import * as acorn from 'acorn';
import { baseWalker, walkSimple, parseModule } from './jsx-ast-utils.js';
import { generate } from 'astring';
import { serialize } from 'parse5';
import { getParser, parseJsx } from './jsx-loader.js';
import { transform } from 'sucrase';
import fs from 'fs';
import type { SsrNode, CustomElementConstructor, SsrElement } from './dom-shim.js';
import type { DefaultTreeAdapterTypes as H } from 'parse5';
import type * as E from 'estree-jsx';

export type Metadata = {
  [key: string]: {
    instanceName: string;
    moduleURL: URL;
    isEntry: boolean;
    source: string;
  };
};

// Rendering tracks additional implementation details without adding public types.
type ComponentDefinition = Metadata[string] & {
  url: URL;
  hydrate?: string;
};
type Definitions = Record<string, ComponentDefinition>;

interface RenderResult {
  html: string | undefined;
  metadata: Metadata;
}

interface HtmlRenderResult extends RenderResult {
  html: string;
}

interface ComponentModule {
  default?: CustomElementConstructor;
  getData?: (props: unknown) => unknown | Promise<unknown>;
}

// Preserve the existing public function-type names alongside the functions.
export type renderToString = typeof renderToString;
export type renderFromHTML = typeof renderFromHTML;

function definitionTagName(
  node: E.CallExpression['arguments'][number] | undefined,
): string | undefined {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral') return node.quasis[0]?.value.raw;
  return undefined;
}

function transformModule(moduleURL: URL, moduleContents: string): string {
  const extension = moduleURL.pathname.split('.').pop();

  // `.js`, `.mjs`, and `.cjs` modules do not need to be transformed by Sucrase,
  // and in fact doing so can break valid JavaScript syntax.
  // https://github.com/ProjectEvergreen/wcc/issues/284
  // Note: this introduces a dis-connect between what WCC can parse vs what it can execute
  // https://github.com/ProjectEvergreen/wcc/discussions/226
  if (!['jsx', 'ts', 'tsx'].includes(extension ?? '')) {
    return moduleContents;
  }

  return transform(moduleContents, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'automatic',
    production: true,
  }).code;
}

function isCustomElementDefinitionNode(
  node: E.ExpressionStatement,
): node is E.ExpressionStatement & { expression: E.CallExpression } {
  const { expression } = node;
  return (
    expression.type === 'CallExpression' &&
    expression.callee.type === 'MemberExpression' &&
    expression.callee.object.type === 'Identifier' &&
    expression.callee.object.name === 'customElements' &&
    expression.callee.property.type === 'Identifier' &&
    expression.callee.property.name === 'define'
  );
}

async function renderComponentRoots<T extends SsrNode>(
  tree: T,
  definitions: Definitions,
): Promise<T> {
  for (const node of tree.childNodes ?? []) {
    if (node.tagName && node.tagName.indexOf('-') > 0) {
      const { tagName } = node;
      const attrs = node.attrs ?? [];

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
            ? [...hasShadow.childNodes, ...(node.childNodes ?? [])]
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

function registerDependencies(moduleURL: URL, definitions: Definitions, depth = 0): void {
  const moduleContents = fs.readFileSync(moduleURL, 'utf-8');
  const moduleCode = transformModule(moduleURL, moduleContents);
  const nextDepth = (depth += 1);
  const customParser = getParser(moduleURL);
  const parser = customParser ? customParser.parser : acorn.Parser;
  const config = customParser
    ? customParser.config
    : {
        ...baseWalker,
      };

  walkSimple(
    parseModule(moduleCode, parser),
    {
      ImportDeclaration(node) {
        const specifier = node.source.value;

        if (typeof specifier === 'string') {
          const isBareSpecifier = specifier.indexOf('.') !== 0 && specifier.indexOf('/') !== 0;
          const extension = typeof specifier === 'string' ? specifier.split('.').pop() : '';

          // would like to decouple .jsx from the core, ideally
          // https://github.com/ProjectEvergreen/wcc/issues/122
          if (!isBareSpecifier && ['js', 'jsx', 'ts', 'tsx'].includes(extension ?? '')) {
            const dependencyModuleURL = new URL(specifier, moduleURL);

            registerDependencies(dependencyModuleURL, definitions, nextDepth);
          }
        }
      },
      ExpressionStatement(node) {
        if (isCustomElementDefinitionNode(node)) {
          const { arguments: args } = node.expression;
          const tagName = definitionTagName(args[0]);
          const component = args[1];
          if (!tagName || component?.type !== 'Identifier') return;
          const tree = parseJsx(moduleURL);
          const isEntry = nextDepth - 1 === 1;

          definitions[tagName] = {
            instanceName: component.name,
            moduleURL,
            source: generate(tree),
            url: moduleURL,
            isEntry,
          };
        }
      },
    },
    config,
  );
}

async function getTagName(moduleURL: URL): Promise<string | undefined> {
  const moduleContents = await fs.promises.readFile(moduleURL, 'utf-8');
  const moduleCode = transformModule(moduleURL, moduleContents);
  const customParser = getParser(moduleURL);
  const parser = customParser ? customParser.parser : acorn.Parser;
  const config = customParser
    ? customParser.config
    : {
        ...baseWalker,
      };
  let tagName: string | undefined;

  walkSimple(
    parseModule(moduleCode, parser),
    {
      ExpressionStatement(node) {
        if (isCustomElementDefinitionNode(node)) {
          const argument = node.expression.arguments[0];
          tagName =
            argument?.type === 'Literal' && typeof argument.value === 'string'
              ? argument.value
              : undefined;
        }
      },
    },
    config,
  );

  return tagName;
}

async function initializeCustomElement(
  elementURL: URL,
  tagName?: string,
  node: Partial<SsrNode> = {},
  definitions: Definitions = {},
  isEntry?: boolean,
  props: unknown = {},
): Promise<SsrElement | undefined> {
  if (!tagName) {
    const depth = isEntry ? 1 : 0;
    registerDependencies(elementURL, definitions, depth);
  }

  const registry = customElements as unknown as {
    get(name?: string): CustomElementConstructor | undefined;
  };
  const registered = registry.get(tagName);
  const component = (await import(elementURL.href)) as ComponentModule;
  const element = registered ?? component.default;
  const dataLoader = component.getData;
  const data = props ? props : dataLoader ? await dataLoader(props) : {};

  if (element) {
    const elementInstance = new element(data);

    Object.assign(elementInstance, node);

    await elementInstance.connectedCallback();

    return elementInstance;
  }
}

// Keep the existing public props contract while checking the implementation as unknown.
function renderToString(
  elementURL: URL,
  wrappingEntryTag?: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Preserve the existing public props type.
  props?: any,
): Promise<RenderResult>;
async function renderToString(
  elementURL: URL,
  wrappingEntryTag = true,
  props: unknown = {},
): Promise<RenderResult> {
  const definitions: Definitions = {};
  const elementTagName = wrappingEntryTag ? await getTagName(elementURL) : undefined;
  const isEntry = !!elementTagName;
  const elementInstance = await initializeCustomElement(
    elementURL,
    undefined,
    undefined,
    definitions,
    isEntry,
    props,
  );

  let html;

  // in case the entry point isn't valid
  if (elementInstance) {
    elementInstance.nodeName = elementTagName ?? '';
    elementInstance.tagName = elementTagName ?? '';

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
      wrappingEntryTag && elementTagName
        ? `
        <${elementTagName}>
          ${serialize(elementInstance as unknown as H.ParentNode)}
        </${elementTagName}>
      `
        : serialize(elementInstance as unknown as H.ParentNode);
  } else {
    console.warn('WARNING: No custom element class found for this entry point.');
  }

  return {
    html,
    metadata: definitions,
  };
}

function renderFromHTML(html: string, elementURLs: URL[]): Promise<HtmlRenderResult>;
async function renderFromHTML(html: string, elements: URL[] = []): Promise<HtmlRenderResult> {
  const definitions: Definitions = {};

  for (const url of elements) {
    registerDependencies(url, definitions, 1);
  }

  const elementTree = getParse(html)(html);
  const finalTree = await renderComponentRoots(elementTree, definitions);

  return {
    html: serialize(finalTree as unknown as H.ParentNode),
    metadata: definitions,
  };
}

export { renderToString, renderFromHTML };
