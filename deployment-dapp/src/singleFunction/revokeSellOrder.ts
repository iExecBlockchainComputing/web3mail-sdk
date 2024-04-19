import { IExec } from 'iexec';

export const revokeSellOrder = async (
  iexec: IExec,
  orderHash: string
): Promise<string> => {
  console.log(`Revoking apporder with the orderHash: ${orderHash}`);
  let txHash = null;
  try {
    txHash = await iexec.order.unpublishApporder(orderHash);
    console.log(`Revoked apporder ${orderHash}\n${txHash}`);
  } catch (error) {
    throw Error(`Failed to cancel apporder ${orderHash}: ${error}`);
  }
  return txHash;
};
