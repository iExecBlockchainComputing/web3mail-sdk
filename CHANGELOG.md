# Changelog

All notable changes to this project will be documented in this file.

## NEXT

### Changed

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
