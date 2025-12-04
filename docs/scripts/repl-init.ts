const inputArea = document.getElementById('input') as HTMLTextAreaElement;
const outputArea = document.getElementById('output') as HTMLTextAreaElement;

const inputContent = inputArea.value;
const worker = new Worker('/assets/repl.bundle.js', { type: 'module' });

worker.onmessage = (result) => {
  console.log({ result: result.data });
  outputArea.value = result.data.html;
};
worker.postMessage([10, 10, inputContent]);

console.log({ inputContent });

inputArea.addEventListener('input', function () {
  worker.postMessage([10, 10, inputArea.value]);
});
