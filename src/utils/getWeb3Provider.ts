import { getSignerFromPrivateKey } from 'iexec/utils';
import { Web3SignerProvider } from '../web3mail/types';

export const getWeb3Provider = (privateKey: string): Web3SignerProvider =>
  getSignerFromPrivateKey('bellecour', privateKey);
