import { getSignerFromPrivateKey } from 'iexec/utils';
import { Web3SignerProvider } from '../web3mail/types.js';

/**
 * Build an ethers signer for Node.js from a private key and an explicit chain.
 *
 * `host` must be provided (chain id or iExec chain host string). There is no default
 * chain: omitting it used to fall back to Arbitrum Sepolia and could migrate users
 * silently when defaults change.
 *
 * @see https://github.com/iExecBlockchainComputing/dataprotector-sdk/blob/dataprotector-v2.0.0-beta.27/packages/sdk/src/utils/getWeb3Provider.ts
 */
export const getWeb3Provider = (
  privateKey: string,
  host: number | string,
  options: { allowExperimentalNetworks?: boolean } = {}
): Web3SignerProvider =>
  getSignerFromPrivateKey(`${host}`, privateKey, {
    allowExperimentalNetworks: options?.allowExperimentalNetworks,
  });
