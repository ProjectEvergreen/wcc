# Contributing

## Welcome!

We're excited for your interest in WCC, and maybe even your contribution!

## Setup

To develop for the project, you'll want to follow these steps:

1. Have [NodeJS LTS](https://nodejs.org) and / or use `nvm` (see below)
1. Clone the repository
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

There are the main tasks, but you can see them all listed in _package.json#scripts_.

- `npm run docs:dev` - Builds the docs site for local development
- `npm start` - Builds a production version of the docs site and serves it locally
- `npm run sandbox` - Starts the sandbox app for live demos and testing
- `npm test` - Run all the tests
- `npm test:tdd` - Run all the tests in watch mode
- `npm run lint` - Run all linters
- `npm run format` - Auto-format all files
