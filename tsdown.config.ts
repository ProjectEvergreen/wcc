import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/*.ts', '!src/*.d.ts'],
  tsconfig: './tsconfig.build.json',
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  fixedExtension: false,
  unbundle: true,
  target: false,
  deps: {
    neverBundle: true,
    onlyBundle: ['@types/estree', '@types/estree-jsx'],
    // Include AST declarations so consumers do not need our development types.
    dts: {
      alwaysBundle: ['estree', 'estree-jsx'],
    },
  },
  copy: [
    { from: 'node_modules/@types/estree/LICENSE', to: 'dist/node_modules/@types/estree' },
    { from: 'node_modules/@types/estree-jsx/LICENSE', to: 'dist/node_modules/@types/estree-jsx' },
  ],
  // We bundle AST declarations to avoid adding addition dependencies just for types
  // This rewrites imports but leaves JSX's `declare module "estree"` targeting the external package.
  // "Redirect" it to our bundled copy so JSX node types are preserved even when consumers have another ESTree version installed.
  plugins: [
    {
      name: 'local-estree-augmentation',
      renderChunk: {
        order: 'post',
        handler(code, chunk) {
          if (chunk.fileName !== 'node_modules/@types/estree-jsx/index.d.ts') return;
          return {
            code: code.replace('declare module "estree"', 'declare module "../estree/index.js"'),
            map: null,
          };
        },
      },
    },
  ],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: false,
  exports: false,
});
