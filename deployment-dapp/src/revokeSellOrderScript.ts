import { revokeSellOrder } from './singleFunction/revokeSellOrder.js';
import { getIExec, loadAppAddress } from './utils/utils.js';
import { orderHashSchema } from './utils/validator.js';

const main = async () => {
  // get env variables from GitHub Actions
  const { RPC_URL, WALLET_PRIVATE_KEY, ORDER_HASH } = process.env;
  if (!WALLET_PRIVATE_KEY)
    throw Error(`Missing WALLET_PRIVATE_KEY environment variable`);

  const iexec = getIExec(WALLET_PRIVATE_KEY, RPC_URL);

  const appAddress = await loadAppAddress();

  if (!appAddress) throw Error('Failed to get app address'); // If the app was not deployed, do not continue

  // validate params
  const orderHash = await orderHashSchema().validate(ORDER_HASH);

  //revoke sell order for Tee app (scone)
  const txHash = await revokeSellOrder(iexec, orderHash);
  if (!txHash) throw Error(`Failed to revoke app sell order: ${orderHash}`);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
