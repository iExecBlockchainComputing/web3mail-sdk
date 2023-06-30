import { IExec } from 'iexec';
import { APP_TAG } from '../config/config.js';

export const publishSellOrder = async (
  iexec: IExec,
  appAddress: string,
  price?: number,
  volume?: number
): Promise<string> => {
  const sconeTeeTag = APP_TAG;
  console.log(
    `Publishing apporder for app ${appAddress} with price ${price} xRLC and volume ${volume}`
  );

  const apporderTemplate = await iexec.order.createApporder({
    app: appAddress,
    appprice: price.toFixed(9) + ' RLC',
    volume: volume,
    tag: sconeTeeTag,
  });
  const apporder = await iexec.order.signApporder(apporderTemplate);
  const orderHash = await iexec.order.publishApporder(apporder);
  console.log(
    `Published apporder ${orderHash}\n${JSON.stringify(apporder, undefined, 2)}`
  );
  return orderHash;
};
