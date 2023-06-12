# Demo

basic `@iexec/dataprotector` demos using various environment and bundlers.

the demo creates a dummy protected data.

## Usage

build the `@iexec/dataprotector` project from the repository root directory

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
- click the `TEST` button to start the protected data creation

**NB:** `create-react-app` demos use the `@iexec/dataprotector` package from npm
