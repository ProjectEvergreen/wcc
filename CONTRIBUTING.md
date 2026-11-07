# Contributing

## Welcome!

We're excited for your interest in WCC, and maybe even your contribution!

## Setup

To develop for the project, you'll want to follow these steps:

1. Clone the repository
1. Have the Node.js version in [.nvmrc](./.nvmrc) installed, or use `nvm` (see below)
1. Run `npm ci`
1. Run `npm run build`
1. Run `npx patch-package`
1. Run `npx playwright install`

### NVM

If you have **NVM (Node Version Manager)** installed, get the recommend node version:

- Windows: [NVM for Windows](https://github.com/coreybutler/nvm-windows/releases)
- Linux/MacOS: [Node Version Manager](https://github.com/nvm-sh/nvm)

And then running `nvm use`

```sh
$ nvm use
```

## Local Development

The local development workflows for WCC are:

Tests and the website load WCC through its package entry points in `dist/`. Run `npm run build` before using those commands, and rebuild after changing `src/`.

- `npm run build` - Build the library into `dist/`
- `npm run build:watch` - Rebuild the library as source files change
- `npm test` - Run the standard JavaScript integration tests
- `npm run test:jsx` - Run the full integration suite, including JSX and TSX, with coverage
- `npm run test:tdd` - Run the standard tests in watch mode
- `npm run test:tdd:jsx` - Run the full integration suite in watch mode
- `npm run lint` - Run all linters
- `npm run check:types` - Validate TypeScript types across the project, including docs, test fixtures, and configuration files
- `npm run check:types:src` - Validate TypeScript types in `src/` with strict checking
- `npm run format` - Auto-format all files

> _While developing, keep `npm run build:watch` running alongside test watchers to keep the compiled output current._

## Website

The website is built with [**Greenwood**](https://www.greenwoodjs.dev). To run the website locally, use one of the following commands:

- `npm run docs:dev` - Start the dev server
- `npm run docs:build` - Generate a production build
- `npm run docs:serve` - Serve a production build

To run tests for the website, first run `npm run build` followed by `npm run docs:build`, then:

- `npm run test:docs` - Run a single suite of tests with Vitest
- `npm run test:docs:tdd` - Run the test suite with Vitest in watch mode

### Sandbox

To assist in local development of WCC, there is a "sandbox" app built into the website, that can be used to validate a number of examples in the browser. (think of it as a storybook for WCC).

After starting the dev server, visit the `/sandbox/` route in your browser. All code for the examples are in _./docs/components/sandbox/_.

### Playground

The website also hosts a Playground (REPL) for seeing WCC output in the browser in real time. Development happens in [this repo](https://github.com/ProjectEvergreen/playground.wcc.dev).

## Publishing

Below are the workflows steps for publishing WCC.

### Local Testing

For local testing and generating an initial tarball, set the intended version before packing. For example, to prepare the next minor version's first release candidate without creating a Git commit or tag:

```sh
npm version preminor --preid rc --no-git-tag-version
npm pack
```

`npm pack` runs the `prepack` build automatically and creates `wc-compiler-<version>.tgz`. Check that the archive contains the built JavaScript, declarations, source maps, etc. You can install the tarball in a separate consumer project with `npm install /absolute/path/wc-compiler-<version>.tgz`.

### Release Candidate

After local testing, publish the tested archive with the `rc` tag. For the `0.23.0-rc.0` example above:

```sh
npm publish ./wc-compiler-0.23.0-rc.0.tgz --tag rc
```

For another candidate, increment the existing RC version and pack again:

```sh
npm version prerelease --preid rc --no-git-tag-version
npm pack
```

### Stable Release

From the final RC, set the stable version and create its archive. For the minor release above, this changes `0.23.0-rc.N` to `0.23.0`:

```sh
npm version minor --no-git-tag-version
npm pack
```

```sh
npm publish ./wc-compiler-0.23.0.tgz --tag latest
```
