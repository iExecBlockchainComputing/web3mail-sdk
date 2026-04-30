import { getSignerFromPrivateKey } from 'iexec/utils';
import { Web3SignerProvider } from '../web3mail/types.js';

export const getWeb3Provider = (
  privateKey: string,
  host: number | string,
  options: { allowExperimentalNetworks?: boolean } = {}
): Web3SignerProvider =>
  getSignerFromPrivateKey(`${host}`, privateKey, {
    allowExperimentalNetworks: options?.allowExperimentalNetworks,
  });
