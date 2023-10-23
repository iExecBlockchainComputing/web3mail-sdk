# Changelog

All notable changes to this project will be documented in this file.

## [0.5.2]

### Added

- add whitelist address as a filter for the restricted app address for fetchMyContacts function
- add linter

## [0.5.1]

### Changed

- fixed bug that prevented web3mail to work with web3mail dap 0.6.0

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
