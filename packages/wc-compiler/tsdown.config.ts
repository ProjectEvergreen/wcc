import { defineConfig } from 'tsdown';
import path from 'node:path';

// With pnpm, declaration bundling follows symlinks into node_modules/.pnpm/<versioned-package>/
// node_modules/@types/. Normalize those paths to preserve our existing published
// dist/node_modules/@types/ layout without embedding pnpm store paths or package versions.
function declarationPath(filename: string): string {
  return filename.replace(
    /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?@types\/(estree(?:-jsx)?)\//g,
    'node_modules/@types/$1/',
  );
}

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
    {
      from: 'node_modules/html-element-attributes/license',
      to: 'dist/licenses/html-element-attributes',
    },
    {
      from: 'node_modules/svg-element-attributes/license',
      to: 'dist/licenses/svg-element-attributes',
    },
    { from: 'node_modules/property-information/license', to: 'dist/licenses/property-information' },
    { from: 'node_modules/html-validate/LICENSE', to: 'dist/licenses/html-validate' },
    {
      from: 'node_modules/@vscode/web-custom-data/LICENSE.md',
      to: 'dist/licenses/vscode-web-custom-data',
    },
    { from: 'node_modules/@types/estree/LICENSE', to: 'dist/node_modules/@types/estree' },
    { from: 'node_modules/@types/estree-jsx/LICENSE', to: 'dist/node_modules/@types/estree-jsx' },
  ],
  // pnpm symlinks dependencies into node_modules/.pnpm/<versioned-package>/node_modules/.
  // The declaration bundler follows those symlinks and includes that layout in emitted filenames and imports.
  // Rewrite both to our dist/node_modules/@types/ layout, then redirect JSX
  // augmentation to the bundled ESTree declaration so consumers retain JSX node types.
  plugins: [
    {
      name: 'portable-ast-declarations',
      generateBundle(_options, bundle) {
        for (const [originalName, chunk] of Object.entries(bundle)) {
          if (chunk.type !== 'chunk' || !originalName.endsWith('.d.ts')) continue;
          const filename = declarationPath(originalName);
          chunk.code = chunk.code.replace(
            /((?:from\s*|import\s*|declare module\s*)["'])([^"']+)(["'])/g,
            (match, prefix: string, specifier: string, quote: string) => {
              if (
                specifier === 'estree' &&
                filename === 'node_modules/@types/estree-jsx/index.d.ts'
              ) {
                return `${prefix}../estree/index.js${quote}`;
              }
              if (!specifier.startsWith('.')) return match;
              const target = declarationPath(
                path.posix.join(path.posix.dirname(originalName), specifier),
              );
              let relative = path.posix.relative(path.posix.dirname(filename), target);
              if (!relative.startsWith('.')) relative = `./${relative}`;
              return `${prefix}${relative}${quote}`;
            },
          );
          if (filename !== originalName) {
            delete bundle[originalName];
            this.emitFile({ type: 'asset', fileName: filename, source: chunk.code });
          }
        }
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
