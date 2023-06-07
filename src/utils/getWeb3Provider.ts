import { getSignerFromPrivateKey } from 'iexec/utils';
import { Web3SignerProvider } from '../web3Mail/types.js';

export const getWeb3Provider = (privateKey: string): Web3SignerProvider =>
  getSignerFromPrivateKey('bellecour', privateKey);
