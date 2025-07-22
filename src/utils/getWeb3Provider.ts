import { getSignerFromPrivateKey } from 'iexec/utils';
import { Web3SignerProvider } from '../web3mail/types.js';

export const getWeb3Provider = (
  privateKey: string,
  options: { allowExperimentalNetworks?: boolean; host?: number | string } = {}
): Web3SignerProvider => {
  const chainHost = options?.host ? `${options.host}` : 'bellecour';
  return getSignerFromPrivateKey(chainHost, privateKey, {
    allowExperimentalNetworks: options?.allowExperimentalNetworks,
    providers: {},
  });
};
