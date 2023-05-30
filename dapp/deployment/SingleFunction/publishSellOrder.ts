import { IExec } from "iexec";
import { APP_PRICE, APP_TAG, APP_VOLUME } from "../config/config.js";

export const publishSellOrder = async (
  iexec: IExec,
  appAddress: string
): Promise<string> => {
  const appprice = APP_PRICE;
  const volume = APP_VOLUME;
  const sconeTeeTag = APP_TAG;
  const apporderTemplate = await iexec.order.createApporder({
    app: appAddress,
    appprice,
    volume,
    tag: sconeTeeTag,
  });
  const apporder = await iexec.order.signApporder(apporderTemplate);
  const orderHash = await iexec.order.publishApporder(apporder);
  return orderHash;
};
