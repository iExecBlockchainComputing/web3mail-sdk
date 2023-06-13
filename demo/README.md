# Demo

basic `@iexec/web3mail` demos using various environment and bundlers.

the demo recovers the contacts (eth address) who have authorized the web3mail dapp to send them emails.

## Usage

build the `@iexec/web3mail` project from the repository root directory

```sh
cd .. && npm ci && npm run build && cd demo
```

pick a demo

```sh
# node typescript demo for example
cd ts-node
```

install deps

```sh
npm i
```

run the demo

```sh
npm start
```

**NB:** for browser demos

- you will need an ethereum wallet connected to [iexec sidechain](https://chainlist.org/chain/134)
- click the `TEST` button to start fetching contacts
