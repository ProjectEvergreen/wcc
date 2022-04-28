const template = document.createElement('template');

template.innerHTML = `
  <style>
    h6 {
      color: red;
      font-size: 25px;
    }

    h6.hydrated {
      animation-duration: 3s;
      animation-name: slidein;
    }

    @keyframes slidein {
      from {
        margin-left: 100%;
        width: 300%;
      }

      to {
        font-size: 25px;
      }
    }
  </style>

  <h6>This is a test</h6>
`;

class TestComponent extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    } else {
      const header = this.shadowRoot.querySelector('h6');

      header.style.color = this.getAttribute('color');
      header.classList.add('hydrated');
    }
  }

  static __hydrate__() {
    console.debug('special __hydrate__ function from TestComponent :)');
    alert('special __hydrate__ function from TestComponent :)');
    let initialized = false;

    window.addEventListener('load', () => {
      let options = {
        root: null,
        rootMargin: '20px',
        threshold: 1.0
      };

      let callback = (entries, observer) => {
        entries.forEach(entry => {
          console.debug({ entry })
          if(!initialized && entry.isIntersecting) {
            alert('Intersected wcc-test, time to hydrate!!!');
            initialized = true;
            document.querySelector('wcc-test').setAttribute('color', 'green');
            import(new URL('./www/components/test.js', import.meta.url));
          }
        });
      };

      let observer = new IntersectionObserver(callback, options);
      let target = document.querySelector('wcc-test');

      observer.observe(target);
    })
  }
}

export { TestComponent }

customElements.define('wcc-test', TestComponent)