export default {
  '*.js': ['npm run lint --'],
  '*.*': ['npm run lint:ls --', 'npm run format --'],
};
