// Proxy ?
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy

// A
// function customDefine(tagName, BaseClass) {
//   console.debug('intercepted customElement.define', { tagName, BaseClass });
// }

// new Proxy(customElements.__proto__.define, customDefine)

// new Proxy(customElements.__proto__, {
//   define: customDefine
// });

/* eslint-disable no-underscore-dangle */
const backupDefine = customElements.define.bind(window.customElements);

window.customElements.define = (tagName, BaseClass) => {
  console.debug('intercepted customElement.define', { tagName, BaseClass });
  
  if (BaseClass.__secret) {
    console.debug('hmmmm... wonder what could we do here????');
    BaseClass.__secret();
  }

  backupDefine(tagName, BaseClass);
};