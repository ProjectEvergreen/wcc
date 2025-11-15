import { parseFragment } from 'parse5';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
}

function removeAttribute(element, attribute) {
  element.attrs = element.attrs.filter((attr) => attr.name !== attribute);
}

function handlePropertyAttribute(element, attribute, value, deps) {
  const propName = attribute.substring(1);
  removeAttribute(element, attribute);
  if (!element.props) {
    element.props = {};
  }
  element[propName] = deps[value] ?? value;
}

function buildStringFromTemplate(template) {
  const { strings, values } = template;

  if (!strings || !values) {
    return { string: '', deps: {} };
  }

  const stringParts = [];
  const deps = {};
  let isElement = false;

  strings.reduce((acc, stringAtIndex, index) => {
    acc.push(stringAtIndex);

    isElement =
      stringAtIndex.includes('<') || stringAtIndex.includes('>')
        ? stringAtIndex.lastIndexOf('<') > stringAtIndex.lastIndexOf('>')
        : isElement;

    const valueAtIndex = values[index];

    if (valueAtIndex != null) {
      const isPrimitive = typeof valueAtIndex === 'string' || typeof valueAtIndex === 'number';
      const valueKey = isPrimitive ? null : generateUUID() + index;
      const lastPart = acc[acc.length - 1];
      const needsQuotes = isElement && !lastPart.endsWith('"');
      acc.push(
        `${needsQuotes ? '"' : ''}${valueKey !== null ? valueKey : valueAtIndex}${needsQuotes ? '"' : ''}`,
      );

      if (valueKey) {
        deps[valueKey] = valueAtIndex;
      }
    }
    return acc;
  }, stringParts);

  return { string: stringParts.join(''), deps };
}

function setAttributes(childNodes, deps) {
  childNodes.forEach((element, index) => {
    const { attrs, nodeName } = element;
    if (nodeName === '#comment') {
      return;
    }
    attrs?.forEach(({ name, value }) => {
      if (name.startsWith('.')) {
        handlePropertyAttribute(childNodes[index], name, value, deps);
      }
    });
    if (element.childNodes) {
      setAttributes(element.childNodes, deps);
    }
  });
}

export function render(content, container) {
  const { string, deps } = buildStringFromTemplate(content);
  const parsedContent = parseFragment(string);

  setAttributes(parsedContent.childNodes, deps);
  const template = document.createElement('template');
  template.content.childNodes = parsedContent.childNodes;
  container.appendChild(template.content.cloneNode(true));
}

export const html = (strings, ...values) => {
  return {
    strings,
    values,
  };
};
