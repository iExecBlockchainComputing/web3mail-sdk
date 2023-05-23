import { getSignerFromPrivateKey } from 'iexec/utils';

export const getEthProvider = (privateKey) =>
  getSignerFromPrivateKey('bellecour', privateKey);
