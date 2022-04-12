// this must come first
import './dom-shim.js';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import fs from 'node:fs/promises';

const deps = [];

async function registerDependencies(moduleURL){
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

      // TODO don't need to update if it already exists
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

async function initializeCustomElement(elementURL) {
  await registerDependencies(elementURL);

  const element = (await import(elementURL)).default;
  const dataLoader = (await import(elementURL)).getData;
  const data = dataLoader ? await dataLoader() : {};
  const elementInstance = new element(data);

  elementInstance.connectedCallback();

  for(const dep in deps) {
    const dataLoader = (await import(deps[dep].moduleURL)).getData;
    const data = dataLoader ? await dataLoader() : {};
    const customElementDependency = new (globalThis.customElements.get(dep))(data);

    customElementDependency.connectedCallback();

    elementInstance.shadowRoot.innerHTML = elementInstance.shadowRoot.innerHTML.replace(`<${dep}></${dep}>`, `
      <${dep}>
        ${customElementDependency.getInnerHTML({ includeShadowRoots: true })}
      </${dep}>
    `)
  }

  return elementInstance;
}

async function renderToString(elementURL) {
  const elementInstance = await initializeCustomElement(elementURL);

  return elementInstance.getInnerHTML({ includeShadowRoots: true });
}

// TODO renderToStream

export {
  renderToString
}