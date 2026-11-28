import { renderToString } from 'wc-compiler';

// Use a worker scope type without adding WebWorker globals to the rest of the docs.
const scope = globalThis as unknown as {
  onmessage: (event: MessageEvent<[string]>) => Promise<void>;
  postMessage: (message: { output?: string; error?: string }) => void;
};

scope.onmessage = async ({ data: [input] }) => {
  const inputURL = URL.createObjectURL(new Blob([input], { type: 'application/javascript' }));

  try {
    const { html } = await renderToString(new URL(inputURL), true);
    if (html === undefined) throw new Error('Export a custom element class as the default export.');
    scope.postMessage({ output: html });
  } catch (error) {
    scope.postMessage({ error: error instanceof Error ? error.message : String(error) });
  } finally {
    URL.revokeObjectURL(inputURL);
  }
};
