# Changelog

All notable changes to this project will be documented in this file.

## [0.9.0]

### Added

- Implemented a resultsCallback mechanism to persist email verification results on-chain.
- Encoded email verification status (true or false) as 32-byte ABI-compliant binary data in the callback.
- Wrote conditional callback-data to computed.json only when explicitly enabled by the requester.

### Changed

- Made the dApp backward-compatible with previous SDK versions by skipping callback-data when useCallback is not provided.
- Improved email verification logic to reuse prior verification from the PoCo subgraph when available, reducing redundant Mailgun calls.

## [0.8.0]

### Changed

- Check email address syntax before trying to send the email.
- Check email deliverability before trying to send the email.

## [0.7.0]

### Changed

- use `@iexec/dataprotector-deserializer` for handling dataprotector v2 protected data.

## [0.6.0]

### Changed

- [BREAKING] Merged requester secrets into one secret object.

## [0.5.0]

### Changed

- Fetch the encrypted email from IPFS and decrypt the content using the provided encryption key when the key matches.

## [0.4.0]

### Changed

- Allow developer to specify the sender Name associated to the sender:
  - **senderName** _(optional)_: the email sender name, it must be between 3 and 20 characters long. It will be displayed as `"<senderName> via Web3mail"` in the `"From"` email header.

## [0.3.0]

### Changed

- Migrate from sconify 5.7.5-v9 to sconify 5.7.5-v12.

## [0.2.0]

### Changed

- add support for `options` in `IEXEC_REQUESTER_SECRET_3` (optional).
- add support for html content via `"contentType": "text/html"` in `options`.

## [0.1.0] Initial release
