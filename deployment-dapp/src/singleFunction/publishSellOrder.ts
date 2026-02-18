import { IExec, TeeFramework } from 'iexec';

export const publishSellOrder = async (
  iexec: IExec,
  appAddress: string,
  price?: number,
  volume?: number,
  teeFramework: TeeFramework = 'tdx'
): Promise<string> => {
  const teeTag = ['tee', teeFramework];
  console.log(
    `Publishing apporder for app ${appAddress} with price ${price} xRLC and volume ${volume} on ${teeTag}`
  );

  const apporderTemplate = await iexec.order.createApporder({
    app: appAddress,
    appprice: price.toFixed(9) + ' RLC',
    volume: volume,
    tag: teeTag,
  });
  const apporder = await iexec.order.signApporder(apporderTemplate);
  const orderHash = await iexec.order.publishApporder(apporder);
  console.log(
    `Published apporder ${orderHash}\n${JSON.stringify(apporder, undefined, 2)}`
  );
  return orderHash;
};
