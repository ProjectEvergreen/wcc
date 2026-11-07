export default {
  '*.{js,ts,tsx}': ['npm run lint:js --'],
  '*.*': ['npm run lint:ls --', 'npm run format --'],
};
