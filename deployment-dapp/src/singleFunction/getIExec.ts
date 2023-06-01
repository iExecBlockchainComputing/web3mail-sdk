import { IExec, utils } from 'iexec';
import { HOST } from '../config/config.js';

export const getIExec = (privateKey: string): IExec => {
  const ethProvider = utils.getSignerFromPrivateKey(HOST, privateKey);
  const iexec = new IExec({
    ethProvider,
  });
  return iexec;
};
