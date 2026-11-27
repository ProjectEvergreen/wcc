// https://github.com/proposal-signals/signal-polyfill?tab=readme-ov-file#creating-a-simple-effect
import { Signal } from 'signal-polyfill';

let needsEnqueue = true;

const w = new Signal.subtle.Watcher(() => {
  if (needsEnqueue) {
    needsEnqueue = false;
    queueMicrotask(processPending);
  }
});

function processPending() {
  needsEnqueue = true;

  for (const s of w.getPending()) {
    s.get();
  }

  w.watch();
}

export function effect(callback: () => unknown): () => void {
  // export effect function as a no-op for SSR environments
  if (typeof window === 'undefined') {
    return () => {};
  }

  let cleanup: unknown;

  const computed = new Signal.Computed(() => {
    if (typeof cleanup === 'function') cleanup();
    cleanup = callback();
  });

  w.watch(computed);
  computed.get();

  return () => {
    w.unwatch(computed);
    if (typeof cleanup === 'function') cleanup();
    cleanup = undefined;
  };
}
