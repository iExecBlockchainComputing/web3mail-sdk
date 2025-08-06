# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0](https://github.com/iExecBlockchainComputing/web3mail-sdk/compare/web3mail-v1.4.0...web3mail-v1.5.0) (2025-08-06)


### Added

* add support for arbitrum-mainnet ([#223](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/223)) ([a4715e2](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/a4715e28f8645515ecce630e809d37d19f26c771))

## [1.4.0](https://github.com/iExecBlockchainComputing/web3mail-sdk/compare/web3mail-v1.3.1...web3mail-v1.4.0) (2025-07-31)


### Added

* add name, accessPrice, remainingAccess and isUserStrict properties to Contact ([#221](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/221)) ([b95e60a](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/b95e60ad9b5d1aa987cc2c1a2c136f6b784ddf60))


### Changed

* stop exporting internal types ([b95e60a](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/b95e60ad9b5d1aa987cc2c1a2c136f6b784ddf60))

## [1.3.1](https://github.com/iExecBlockchainComputing/web3mail-sdk/compare/web3mail-v1.3.0...web3mail-v1.3.1) (2025-07-30)


### Changed

* prevent fetchUserContacts error when user has no contact ([#219](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/219)) ([339df22](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/339df222f8fcddc321e99d32928ea6bcd8a1cbd8))

## [1.3.0](https://github.com/iExecBlockchainComputing/web3mail-sdk/compare/web3mail-v1.2.2...web3mail-v1.3.0) (2025-07-29)


### Added

* add callback mechanisme ([#217](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/217)) ([f1f2866](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/f1f28669fa08a09fc9f7bd92fa379fbb56e689b8))
* add multichain configuration support ([4b2de3a](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/4b2de3a014c97c00fa4ac64b759899fe598a9695))
* add support for experimental networks ([#196](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/196)) ([887f97a](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/887f97aa4ae2a3f3c347806439d353347ce96bd7))
* dapp address resolution from compass ([#200](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/200)) ([2216f3b](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/2216f3b6907b73b756b1a409c6d7c098b2b701b6))
* update arbitrum sepolia whitelist smart contract address ([#207](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/207)) ([50965f6](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/50965f65690a5717686dfdd2392dede89142adff))


### Changed

* move to latest arbitrum-sepolia-testnet deployment ([#215](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/215)) ([dde03ce](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/dde03ce1223fc215eccf1a12467d3dd6b3e2b1be))
* move to latest arbitrum-sepolia-testnet deployment ([#216](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/216)) ([3d5b39b](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/3d5b39bb877ffae92f2d6f0b762c5a2e2aabbce0))
* remove redundant useVoucher parameter in sendEmail method ([84f26de](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/84f26de7ab5bbb4c2b3b38a834b289bac8d19cdb))
* remove redundant useVoucher parameter in sendEmail method ([34024fd](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/34024fddefdebba79f0861651741ba2915fea919))
* **sendEmail:** use custom workerpool when provided ([f66c52a](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/f66c52abdd5a3e1b8fac07a934c8969b917f7a16))
* update arbitrum-sepolia dataProtectorSubgraph URL ([#201](https://github.com/iExecBlockchainComputing/web3mail-sdk/issues/201)) ([74e3266](https://github.com/iExecBlockchainComputing/web3mail-sdk/commit/74e3266e49959e287638028fee8aa1617fa7a72a))

## [1.2.2]

### Added
- Introduced callback parameter in the requestorder, enabling tasks to trigger result callbacks after execution.
- Added useCallback flag to the requesterSecret to control whether the dApp should write callback-data in its output.

## [1.2.1]

### Changed

- Migrated Bellecour subgraph URL to `https://thegraph.iex.ec/...`

## [1.2.0]

### Changed

- Upgraded the iexec dependency to ^8.13.1, which includes:
  - Migrated default SMS URL to https://sms.iex.ec.
  - Migrated from the deprecated SMS apps secrets endpoint.

## [1.1.1]

### Changed

- Update builder dashboard URL in some error messages related to `sendEmail()` method
- Use user specific workerpool orders if `useVoucher` is set to `true`

## [1.1.0]

### Added

- support for iExec voucher in `sendEmail()` via `useVoucher` option

### Changed

- Directly return yup `ValidationError` instead of wrapping it into a WorkflowError, for `fetchUserContacts` and `sendEmail`
- `sendEmail`: Changed returned error message from 'ProtectedData is not valid' to 'This protected data does not contain "email:string" in its schema.'

## [1.0.4] (2024-08-08)

### Added

- support for ethers `AbstractProvider` and `AbstractSigner` in constructor

### Changed

- update `kubo-rpc-client` from v3 to v4
- update `iexec` and `ethers` dependencies

## [1.0.3]

### Added

- support for ethers `AbstractProvider` and `AbstractSigner` in constructor

### Changed

- remove unnecessary initialization of storage in `sendEmail`
- updated `iexec` and `ethers` dependencies

## [1.0.2]

### Changed

- be able to call `fetchMyContacts` with `isUserStrict` param

## [1.0.1]

### Changed

- fix drone ci for package publication on npm

## [1.0.0]

### Added

- added `isUserStrict` optional param into both `fetchUserContacts` and `fetchMyContacts` functions

### Changed

- Make the `ethProvider` constructor parameter optional, enabling access to read functions without requiring a wallet.
- [BREAKING] Ship ES2022 JavaScript instead of es2015 (aka es6) in order to support `cause` optional field in `Error`:
  - Minimum browser versions: <https://gist.github.com/Julien-Marcou/156b19aea4704e1d2f48adafc6e2acbf>
  - Minimum Node.js version: 18
- Changed `fetchMyContacts`, `fetchUserContacts` and `sendEmail` error handling:
  - Distinguish iExec protocol errors from other errors
  - Store original error as the error cause
- [BREAKING] Removed `originalError` from `WorkflowError`

## [0.6.1]

### Changed

- upgraded the `iexec` dependency to ^8.7.0
- fixed `Buffer` polyfill issue

## [0.6.0]

### Added

- added `fetchUserContacts` method allowing to fetch contacts of a given user
- added `workerpoolAddressOrEns` options to `sendEmail` to specify the workerpool to use (defaults to iExec's production workerpool)
- added `dataMaxPrice`, `appMaxPrice` and `workerpoolMaxPrice` options to `sendEmail` to specify the maximum price in nRLC to pay to each provider
- added `label` option to `sendEmail` to tag the web3mail task onchain via iexec_args
- added `dappAddressOrENS`, `dappWhitelistAddress`, `dataProtectorSubgraph`, `ipfsNode`, `ipfsGateway` configuration options to the constructor

### Changed

- optimized market api requests in `fetchMyContact` and `sendEmail`
- fixed bug that prevented ethereum address to be used as `dappAddressOrENS`
- use iExec production workerpool for `sendEmail` if none is specified
- support for access granted to web3mail dapps whitelist in `sendEmail`
- migrated from ethers v5 to ethers v6

## [0.5.2]

### Added

- support for access granted to web3mail dapps whitelist in `fetchMyContacts`
- add linter

## [0.5.1]

### Changed

- fixed bug that prevented web3mail to work with web3mail dapp 0.6.0

## [0.5.0]

### Changed

- [BREAKING] Updated internal implementation to work with web3mail dapp v0.6.0 (merged requester secrets into one secret object)

## [0.4.0]

### Changed

- Enabled sending emails with a maximum size of 512 KB, an enhancement from the previous limit of 4,096 bytes.
- Encryption of the email content and uploaded it to IPFS.

## [0.3.0]

### Added

- Allow developer to specify the sender Name associated to the sender:
  add optional `senderName: string` to `sendEmail` method

### Changed

- Migrate from sconify 5.7.5-v9 to sconify 5.7.5-v12

## [0.2.0]

### Added

- add optional `contentType: 'text/plain' | 'text/html'` (default `'text/plain'`) to `sendEmail` method (you can send plain text or a html type content)

## [0.1.1]

### Changed

- fixed installation issue for Windows users
- fixed email content validation issue

## [0.1.0] Initial release
