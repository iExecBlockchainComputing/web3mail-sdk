import { IExec } from 'iexec';
import { DEFAULT_APP_PRICE, APP_TAG, APP_VOLUME } from '../config/config.js';

export const revokeSellOrder = async (
  iexec: IExec,
  appAddress: string,
  price?: number
): Promise<string> => {
  const appprice = price || DEFAULT_APP_PRICE;
  console.log(`Revoking apporder for app ${appAddress}`);

  const appOrders = await iexec.orderbook.fetchAppOrderbook(appAddress);
  const orderHash = appOrders?.orders.find(
    (o) => o.order.appprice === appprice
  )?.orderHash;

  if (!orderHash) throw Error('No corresponding appOrder found');
  const txHash = await iexec.order.unpublishApporder(orderHash);
  console.log(`Revoked apporder ${orderHash}\n${txHash}`);
  return txHash;
};
