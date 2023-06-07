<p align="center">
  <a href="https://iex.ec/" rel="noopener" target="_blank"><img width="150" src="./logo-iexec.png" alt="iExec logo"/></a>
</p>

<h1 align="center">Web3Mail</h1>

**Web3Mail** offers developers methods to create apps that:

- enable an entity (such as a (d)app provider or an end-user) to email an Ethereum account holder without knowing her/his email address
- eliminate the need for end-users to share their email address with multiple third-parties, reducing the risk of data breaches and spam.

Web3Mail is composed of 2 methods:

- **fetchMyContacts** — that enables an entity to retrieve a list of Ethereum accounts whose owners have authorized the entity to email them
- **sendEmail** — that allows an entity to email a user (previously fetched via the fetchMyContacts method) knowing only her/his Ethereum account.

<div align="center">

[![npm](https://img.shields.io/npm/v/web3mail-sdk)](https://www.npmjs.com/package/@iexec/web3mail)[![license](https://img.shields.io/badge/license-Apache%202-blue)](/LICENSE)

</div>

## Installation

Web3Mail is available as an [npm package](https://www.npmjs.com/package/@iexec/web3mail).

**npm:**

```sh
npm install @iexec/web3mail
```

**yarn:**

```sh
yarn add @iexec/web3mail
```

## Get started

### Browser

```ts
import { IExecWeb3Mail } from "@iexec/web3mail";

const web3Provider = window.ethereum;
const web3Mail = new IExecWeb3Mail(web3Provider);
```

### NodeJS

```ts
import { IExecWeb3Mail, getWeb3Provider } from "@iexec/web3mail";

const { PRIVATE_KEY } = process.env; 

const web3Provider = getWeb3Provider(PRIVATE_KEY);
const web3Mail = new IExecWeb3Mail(web3Provider);
```

## Documentation

- [Web3Mail documentation](https://tools.docs.iex.ec/tools/web3mail)
- [Web3Mail technical design](./technical-design/index.md)
- [iExec Protocol documentation](https://protocol.docs.iex.ec)

## License

This project is licensed under the terms of the [Apache 2.0](/LICENSE).
