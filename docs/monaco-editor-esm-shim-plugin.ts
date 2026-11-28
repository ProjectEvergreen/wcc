import type { ResourcePlugin } from '@greenwood/cli';

// https://github.com/microsoft/monaco-editor/issues/886
// have to strip out CSS `import` statements from the ESM build of Monaco Editor,
// otherwise the browser will attempt to load them as ESM and fail
class StripCssImportsResource {
  extensions: string[];
  contentType: string;

  constructor() {
    this.extensions = ['js'];
    this.contentType = 'application/javascript';
  }

  async shouldIntercept(url: URL) {
    return (
      /node_modules\/(?:.pnpm\/[^/]+\/node_modules\/)?monaco-editor\//.test(url.pathname) &&
      url.pathname.endsWith('.js')
    );
  }

  async intercept(url: URL, request: Request, response: Response) {
    const contents = await response.text();
    const stripped = contents.replace(/^\s*import\s+[^;]*['"]([^'"]+\.css)['"]\s*;?\s*$/gm, '');

    return new Response(stripped, {
      headers: {
        'Content-Type': this.contentType,
      },
    });
  }
}

export function monacoEditorEsmShimPlugin(): ResourcePlugin {
  return {
    type: 'resource',
    name: 'monaco-editor-strip-css-imports-plugin',
    provider: () => new StripCssImportsResource(),
  };
}
