# Contributing

## Welcome!
We're excited for your interest in WCC, and maybe even your contribution!

## Setup

To develop for the project, you'll want to follow these steps:

1. Have [NodeJS LTS](https://nodejs.org) and / or use `nvm` (see below)
1. Clone the repository
1. Run `npm ci`

If you have **NVM (Node Version Manager)** installed, get the recommend node version:

- Windows: [NVM for Windows](https://github.com/coreybutler/nvm-windows/releases)
- Linux/MacOS: [Node Version Manager](https://github.com/nvm-sh/nvm)

And then running `nvm use`

```sh
$ nvm use
Found '/Users/<directory_location>/greenwood/.nvmrc' with version <14.17.0>
Now using node v14.17.0 (npm v6.14.13)
```

## Local Development

The local development flow is based around building the docs website, using `wcc` in an SSG based workflow, and running tests.

### Commands

There are the main tasks, but you can see them all listed in _package.json#scripts_.

- `develop` - Builds the docs website using `wcc` with live reload
- `test` - Run all the tests
- `test:tdd` - Run all the tests in watch mode
- `serve` - Builds the docs website using `wcc` with standard server