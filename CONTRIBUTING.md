# Contributing

## Welcome!

We're excited for your interest in WCC, and maybe even your contribution!

## Setup

To develop for the project, you'll want to follow these steps:

1. Clone the repository
1. Have [NodeJS LTS](https://nodejs.org) installed and / or use `nvm` (see below)
1. Run `npm ci`

### NVM

If you have **NVM (Node Version Manager)** installed, get the recommend node version:

- Windows: [NVM for Windows](https://github.com/coreybutler/nvm-windows/releases)
- Linux/MacOS: [Node Version Manager](https://github.com/nvm-sh/nvm)

And then running `nvm use`

```sh
$ nvm use
```

## Local Development

The local development flow is based around building the docs website, using `wcc` in an SSG based workflow, and running tests.

### Commands

These are the main tasks, and you can see them all listed in _package.json#scripts_.

- `npm run dev` - Builds the docs site for local development
- `npm test` - Run all the tests
- `npm test:tdd` - Run all the tests in watch mode
- `npm run lint` - Run all linters
- `npm run check:types` - Run `tsc` to validate TypeScript types
- `npm run format` - Auto-format all file

## Website

The website is built with [**Greenwood**](https://www.greenwoodjs.dev). To run the website locally, use one of the following commands:

- `npm run dev` - Start the dev server
- `npm run build` - Generate a production build
- `npm run serve` - Serve a production build

### Sandbox

To assist in local development of WCC, there is a "sandbox" app built into the website, that can be used to validate a number of examples in the browser. (think of it as a storybook for WCC).

After starting the dev server, visit the `/sandbox/` route in your browser. All code for the examples are in _./docs/components/sandbox/_.

### Playground

The website also hosts a Playground (REPL) for seeing WCC output in the browser in real time. Development happens in [this repo](https://github.com/ProjectEvergreen/playground.wcc.dev).
