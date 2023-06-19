import { IExec } from 'iexec';
import {
  DEFAULT_APP_PRICE,
  APP_TAG,
  DEFAULT_APP_VOLUME,
} from '../config/config.js';
import { isUndefined } from '../utils/validator.js';

export const publishSellOrder = async (
  iexec: IExec,
  appAddress: string,
  price?: number | undefined,
  volume?: number | undefined
): Promise<string> => {
  const sconeTeeTag = APP_TAG;
  console.log(
    `Publishing apporder for app ${appAddress} with price ${price} xRLC and volume ${volume}`
  );

  const apporderTemplate = await iexec.order.createApporder({
    app: appAddress,
    appprice: price + ' RLC',
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
