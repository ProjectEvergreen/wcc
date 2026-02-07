import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import './greeting.ts';

describe('Components/Greeting', () => {
  let greeting: HTMLElement;

  describe('Default Behavior', () => {
    beforeEach(async () => {
      greeting = document.createElement('wcc-greeting');

      document.body.appendChild(greeting);
    });

    it('should not be undefined', () => {
      expect(greeting).not.equal(undefined);
      expect(greeting.querySelectorAll('span').length).equal(1);
    });

    it('should render the default greeting text', () => {
      expect(greeting.querySelector('span').textContent).equal('Hello World!');
    });
  });

  describe('Passing Name Attribute', () => {
    const name = 'WCC';

    beforeEach(async () => {
      greeting = document.createElement('wcc-greeting');
      greeting.setAttribute('name', name);

      document.body.appendChild(greeting);
    });

    it('should render the default greeting text', () => {
      expect(greeting.querySelector('span').textContent).equal(`Hello ${name}!`);
    });
  });

  afterEach(() => {
    greeting.remove();
    greeting = undefined;
  });
});
