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
  price?: string,
  volume?: string
): Promise<string> => {
  const appPrice = isUndefined(price)
    ? DEFAULT_APP_PRICE
    : parseInt(price) * 10e9;
  const appVolume = isUndefined(volume) ? DEFAULT_APP_VOLUME : parseInt(volume);
  const sconeTeeTag = APP_TAG;
  console.log(
    `Publishing apporder for app ${appAddress} with price ${appPrice} and volume ${appVolume}`
  );

  const apporderTemplate = await iexec.order.createApporder({
    app: appAddress,
    appprice: appPrice,
    volume: appVolume,
    tag: sconeTeeTag,
  });
  const apporder = await iexec.order.signApporder(apporderTemplate);
  const orderHash = await iexec.order.publishApporder(apporder);
  console.log(
    `Published apporder ${orderHash}\n${JSON.stringify(apporder, undefined, 2)}`
  );
  return orderHash;
};
