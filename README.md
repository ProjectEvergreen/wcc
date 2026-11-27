<img src="https://wcc.dev/assets/wcc-logo.svg" width="30%"/>

# Web Components Compiler (WCC)

WCC renders standard Web Components into HTML. This monorepo contains the compiler and its documentation website.

## Workspaces

- [packages/wc-compiler](./packages/wc-compiler/README.md) — the published `wc-compiler` package
- [docs](./docs/) — the Greenwood documentation website

> _For installation and usage of WCC see our [documentation website](https://wcc.dev)._

## Development

### Setup

1. Clone the repo
1. Have the Node.js version in `.nvmrc` and the pnpm version pinned in `package.json` installed.
1. Run `pnpm install --frozen-lockfile`

### Commands

Run commands from the repository root:

- `pnpm run build:watch` — rebuild the compiler as source files change
- `pnpm test` — run the standard compiler tests
- `pnpm run test:jsx` — run the full compiler suite (including JSX) with coverage
- `pnpm run docs:dev` — build local WCC and start the docs development server
- `pnpm run docs:build` — build local WCC and the production website

> _See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information about contributing to the project._
