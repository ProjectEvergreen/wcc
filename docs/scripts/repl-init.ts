const inputArea = document.getElementById('input') as HTMLTextAreaElement;
const outputArea = document.getElementById('output') as HTMLTextAreaElement;
const workerUrl = new URL('./repl.ts', import.meta.url);

const inputContent = inputArea.value;
const worker = new Worker(workerUrl, { type: 'module' });

worker.onmessage = (result) => {
  outputArea.value = result.data.html;
};
worker.postMessage([inputContent]);

inputArea.addEventListener('input', function () {
  worker.postMessage([inputArea.value]);
});
