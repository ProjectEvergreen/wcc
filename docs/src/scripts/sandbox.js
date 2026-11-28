const sandbox = document.querySelector('.sandbox');
const examples = [...sandbox.querySelectorAll('.example')];
const links = [...sandbox.querySelectorAll('nav a')];
const search = sandbox.querySelector('#example-search');

function selectExample() {
  const selected = examples.find((example) => `#${example.id}` === location.hash) || examples[0];

  for (const example of examples) {
    example.hidden = example !== selected;
  }
  for (const link of links) {
    if (link.hash === `#${selected.id}`) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

search.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase();
  let matches = 0;

  for (const [index, link] of links.entries()) {
    const heading = examples[index].querySelector('.example-heading').textContent.toLowerCase();
    const match = heading.includes(query);
    link.closest('li').hidden = !match;
    if (match) matches++;
  }
  for (const group of sandbox.querySelectorAll('.example-group')) {
    group.hidden = !group.querySelector('li:not([hidden])');
  }
  sandbox.querySelector('.example-count').textContent = `${matches} of ${examples.length} examples`;
  sandbox.querySelector('#search-empty').hidden = matches > 0;
});

window.addEventListener('hashchange', selectExample);
selectExample();

const randomReset = () => String(Math.floor(Math.random() * 100));

sandbox.querySelector('#signal-greeting-input').addEventListener('input', (event) => {
  sandbox.querySelector('sb-signal-greeting-jsx').setAttribute('name', event.target.value);
});
sandbox.querySelector('#signal-counter-reset').addEventListener('click', () => {
  sandbox.querySelectorAll('sb-signal-counter-tsx').forEach((element) => {
    element.setAttribute('count', randomReset());
  });
});
sandbox.querySelector('#signal-counter-jsx-reset').addEventListener('click', () => {
  sandbox.querySelector('sb-signal-counter-jsx').setAttribute('count', randomReset());
});
