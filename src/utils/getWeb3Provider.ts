import { getSignerFromPrivateKey } from 'iexec/utils';
import { EnhancedWallet } from 'iexec';

export const getWeb3Provider = (privateKey: string): EnhancedWallet =>
  getSignerFromPrivateKey('bellecour', privateKey);
