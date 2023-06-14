import { IExec } from 'iexec';
import { APP_PRICE, APP_TAG, APP_VOLUME } from '../config/config.js';

export const publishSellOrder = async (
  iexec: IExec,
  appAddress: string,
  price?: number
): Promise<string> => {
  const appprice = price || APP_PRICE;
  const volume = APP_VOLUME;
  const sconeTeeTag = APP_TAG;
  console.log(`Publishing apporder for app ${appAddress}`);
  const apporderTemplate = await iexec.order.createApporder({
    app: appAddress,
    appprice,
    volume,
    tag: sconeTeeTag,
  });
  const apporder = await iexec.order.signApporder(apporderTemplate);
  const orderHash = await iexec.order.publishApporder(apporder);
  console.log(
    `Published apporder ${orderHash}\n${JSON.stringify(apporder, undefined, 2)}`
  );
  return orderHash;
};
