# Contributing

## Welcome!

We're excited for your interest in WCC, and maybe even your contribution!

## Setup

To develop for the project, you'll want to follow these steps:

1. Clone the repository
1. Have the Node.js version in [.nvmrc](./.nvmrc) installed, or use `nvm` (see below)
1. Install the pinned pnpm version with `npm install --global pnpm@12.23.0`
1. Run `pnpm ci`
1. Run `pnpm run build`
1. Run `pnpm --filter docs exec playwright install`

### NVM

If you have **NVM (Node Version Manager)** installed, get the recommend node version:

- Windows: [NVM for Windows](https://github.com/coreybutler/nvm-windows/releases)
- Linux/MacOS: [Node Version Manager](https://github.com/nvm-sh/nvm)

And then running `nvm use`

```sh
$ nvm use
```

## Workspace Layout

- The private root owns shared tooling and convenience scripts
- `packages/wc-compiler/` contains the published `wc-compiler` package
- `docs/` is a the website documentation for WCC

> _The docs depend on the local `wc-compiler` source through `workspace:*` references in *package.json*. Make sure to build WCC before consuming its public exports; `pnpm run docs:dev` and `pnpm run docs:build` do this automatically._

## Local Development

The local development workflows for WCC are:

- `pnpm run build` - Build the library into `packages/wc-compiler/dist/`
- `pnpm run build:watch` - Rebuild the library as source files change
- `pnpm test` - Run the standard JavaScript integration tests
- `pnpm run test:jsx` - Run the full integration suite, including JSX and TSX, with coverage
- `pnpm run test:tdd` - Run the standard tests in watch mode
- `pnpm run test:tdd:jsx` - Run the full integration suite in watch mode
- `pnpm run lint` - Run Oxlint for JavaScript and TypeScript, ls-lint for filenames, and Stylelint for CSS
- `pnpm run check:types` - Validate TypeScript types across the project, including docs, test fixtures, and configuration files, plus strict checking of the compiler source
- `pnpm run format` - Auto-format all files with Oxfmt
- `pnpm run format:check` - Check formatting without writing files

> _While developing, keep `pnpm run build:watch` running alongside test watchers to keep the compiled output current._

For VS Code users, install the [Oxc extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) for lint diagnostics and select it as the default formatter. Lint rules and formatting options live in _.oxlintrc.json_ and _.oxfmtrc.json_, respectively.

## JSX Attribute Definitions

WCC maintains a custom definition file for mapping HTML attributes to JSX by combining a few packages together to extract their various sources of information and generating a TypeScript definition file from them.

- [**html-element-attributes**](https://github.com/wooorm/html-element-attributes) and [**svg-element-attributes**](https://github.com/wooorm/svg-element-attributes) supply attribute names for HTML and SVG tags, respectively.
- [**property-information**](https://github.com/wooorm/property-information) supplies name mappings and value categories such as boolean and numeric.
- [**html-validate**](https://html-validate.org/usage/elements.html) and [**@vscode/web-custom-data**](https://github.com/microsoft/vscode-custom-data) supply value rules and fixed keyword lists. Validator rules take precedence over completion suggestions.

During the build, `generate-jsx-attributes.ts` combines all these sources into the definition file to be published with WCC.

When updating the generator or its metadata:

- Run `pnpm run jsx-types:generate` and commit the generated file so changes can be reviewed.
- Run `pnpm run jsx-types:check` to check freshness without writing files. CI runs this before the build, since regeneration would otherwise hide stale committed output.

Notes:

- Use HTML spellings such as `for`, `readonly`, and `tabindex`, and preserve SVG casing such as `viewBox`. Fixed values are checked per tag: `loading="lzy"` is an error, and input and button `type` have different allowed values.
- URLs, custom names, MIME types, token lists, and most SVG values retain broad types for the time being. These declarations do not validate every grammar, attribute relationship, or unknown hyphenated name.
- Typing changes do not change serialization or signal updates. Accepting null does not imply attribute omission; declaring namespace-qualified names does not add compiler support for that syntax. There will be plans to support this in the future.
- The generator contains a few manual fixes for incomplete upstream metadata. Each fix links to the relevant standard explaining the allowed values.

## Website

The website is built with [**Greenwood**](https://www.greenwoodjs.dev). To run the website locally, use one of the following commands:

- `pnpm run docs:dev` - Start the dev server
- `pnpm run docs:build` - Generate a production build
- `pnpm run docs:serve` - Serve a production build

To run tests for the website, first run `pnpm run build` followed by `pnpm run docs:build`, then:

- `pnpm run test:docs` - Run a single suite of tests with Vitest
- `pnpm run test:docs:tdd` - Run the test suite with Vitest in watch mode

### Sandbox

To assist in local development of WCC, there is a "sandbox" app built into the website, that can be used to validate a number of examples in the browser. (think of it as a storybook for WCC).

After starting the dev server, visit the `/sandbox/` route in your browser. All code for the examples are in _./docs/src/components/sandbox/_.

### Playground

The website also hosts a Playground (REPL) for seeing WCC output in the browser in real time. Run `pnpm run docs:dev` and visit `/playground/`. It uses the local workspace compiler, so rebuild WCC after compiler changes (or run `pnpm run build:watch` alongside the docs server).

## Pull Requests

Generally, it's best to open an issue first before submitting a Pull Request. This is a good opportunity to validate the work first, and ask any questions.

This project uses conventional commits when submitting pull requests in combination with Husky pre-commit hooks that runs linting and formatting scripts. When ready to commit code to submit a PR, run `pnpm run commit` and follow the prompts.

### Documentation

For unreleased feature documentation related changes, open a companion PR against `docs/release-0.x.y` and link it from the feature PR. Routine docs fixes that can go live anytime can be included in the original PR.

## Publishing

Run the commands below from the repository root; the root and docs manifests are private. Refresh the lockfile with `pnpm install --lockfile-only` after changing the compiler version. The package README and license live in `packages/wc-compiler/` and are included when packing.

> _If you have local changes that you are aware of, you can add `--no-git-checks` to the pnpm commands below._

### Local Testing

For local testing and generating an initial tarball.

For example, to prepare the next minor version's first release candidate without creating a Git commit or tag:

```sh
$ pnpm --dir packages/wc-compiler version preminor --preid rc --no-git-tag-version
v0.23.0-rc.0

$ pnpm --filter wc-compiler pack --pack-destination ../..
```

> _`pnpm --filter wc-compiler pack` runs the `prepack` build automatically and creates `wc-compiler-<version>.tgz`. You can check that the archive contains the correct files. You can also install the tarball in a separate project with `npm install /absolute/path/wc-compiler-<version>.tgz`._

### Release Candidate

After local testing and wanting to publish to npm. This create an **rc** tag.

For the `0.23.0-rc.0` example above:

```sh
$ npm publish ./wc-compiler-0.23.0-rc.0.tgz --tag rc
```

To publish another candidate, increment the existing RC version and pack again:

```sh
$ pnpm --dir packages/wc-compiler version prerelease --preid rc --no-git-tag-version
v0.23.0-rc.1

$ pnpm --filter wc-compiler pack --pack-destination ../..
```

---

Make sure to bump and tag the version for all RC releases:

```sh
$ git commit packages/wc-compiler/package.json pnpm-lock.yaml -m "chore(workspace): bump to next release version 0.23.0-rc.0"
$ git tag -a 0.23.0-rc.0 -m "chore: tagging 0.23.0-rc.0 release"
$ git push origin <branch> --tags
```

### Stable Release

To publish to **latest** on npm.

Using the minor release above, this drops the `-rc.N`:

```sh
$ pnpm --dir packages/wc-compiler version minor --no-git-tag-version
v0.23.0

$ pnpm --filter wc-compiler pack --pack-destination ../..
$ npm publish ./wc-compiler-0.23.0.tgz --tag latest
```

After publishing a stable release, make sure to bump and tag the version:

```sh
$ git commit packages/wc-compiler/package.json pnpm-lock.yaml -m "chore(workspace): bump to next release version 0.23.0"
$ git tag -a 0.23.0 -m "chore(workspace): tagging 0.23.0 release"
$ git push origin master --tags
```
