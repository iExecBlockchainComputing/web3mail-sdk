import { IExec, utils } from 'iexec';
import {
  HOST,
  HOST_SMS_DEBUG_GRAMINE,
  HOST_SMS_DEBUG_SCONE,
} from '../config/config.js';

export const initIexecConstructorDev = (privateKey: string): IExec => {
  const ethProvider = utils.getSignerFromPrivateKey(HOST, privateKey);
  const iexec = new IExec(
    {
      ethProvider,
    },
    {
      smsURL: {
        scone: HOST_SMS_DEBUG_SCONE,
        gramine: HOST_SMS_DEBUG_GRAMINE,
      },
    }
  );
  return iexec;
};

export const initIexecConstructorProd = (privateKey: string): IExec => {
  const ethProvider = utils.getSignerFromPrivateKey(HOST, privateKey);
  const iexec = new IExec({
    ethProvider,
  });
  return iexec;
};
