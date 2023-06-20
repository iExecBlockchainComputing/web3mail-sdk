import { IExec } from 'iexec';
import { DEFAULT_APP_PRICE, DEFAULT_APP_VOLUME } from '../config/config.js';
import { isUndefined } from '../utils/validator.js';

export const revokeSellOrder = async (
  iexec: IExec,
  appAddress: string,
  orderHash: string
): Promise<string> => {
  console.log(
    `Revoking apporder for app ${appAddress} with the orderHash: ${orderHash} `
  );
  let txHash = null;
  try {
    txHash = await iexec.order.unpublishApporder(orderHash);
    console.log(`Revoked apporder ${orderHash}\n${txHash}`);
  } catch (error) {
    throw Error(`Failed to cancel apporder ${orderHash}: ${error}`);
  }
  return txHash;
};
