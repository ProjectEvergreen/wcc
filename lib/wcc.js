// this must come first
import './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import fs from 'node:fs/promises';

const deps = [];

async function registerCustomElement(moduleURL){
  const moduleContents = await fs.readFile(moduleURL, 'utf-8');

  walk.simple(acorn.parse(moduleContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }), {
    async ExpressionStatement(node) {
      const { expression } = node;

      if(expression.type === 'CallExpression' && expression.callee && expression.callee.object && expression.callee.property && expression.callee.object.name === 'customElements' && expression.callee.property.name === 'define') {
        const tagName = node.expression.arguments[0].value;

        deps[tagName] = {
          instanceName: node.expression.arguments[1].name,
          moduleURL
        }
      }
    }
  });
}

async function renderToString(elementURL) {
  const elementContents = await fs.readFile(elementURL, 'utf-8');

  walk.simple(acorn.parse(elementContents, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }), {
    async ImportDeclaration(node) {
      const moduleURL = new URL(`../www/${node.source.value}`, import.meta.url);

      await registerCustomElement(moduleURL);
    }
  });

  const element = (await import(elementURL)).default;
  const elementInstance = new element();

  elementInstance.connectedCallback();

  for(const dep in deps) {
    const customElementDependency = new (globalThis.customElements.get(dep))();

    customElementDependency.connectedCallback();

    elementInstance.shadowRoot.innerHTML = elementInstance.shadowRoot.innerHTML.replace(`<${dep}></${dep}>`, `
      <${dep}>
        ${customElementDependency.getInnerHTML({ includeShadowRoots: true })}
      </${dep}>
    `)
  }

  return elementInstance.getInnerHTML({ includeShadowRoots: true });
}

// TODO renderToStream

export {
  renderToString
}