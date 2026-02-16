import { publishSellOrder } from './singleFunction/publishSellOrder.js';
import { getIExec, loadAppAddress } from './utils/utils.js';
import {
  positiveNumberSchema,
  positiveStrictIntegerSchema,
} from './utils/validator.js';

const main = async () => {
  const { RPC_URL, WALLET_PRIVATE_KEY, PRICE, VOLUME } = process.env;

  const iexec = getIExec(WALLET_PRIVATE_KEY, RPC_URL);

  const appAddress = await loadAppAddress();

  if (!appAddress) throw Error('Failed to get app address'); // If the app was not deployed, do not continue

  // validate params
  const price = await positiveNumberSchema()
    .required()
    .label('PRICE')
    .validate(PRICE);
  const volume = await positiveStrictIntegerSchema()
    .required()
    .label('VOLUME')
    .validate(VOLUME);

  console.log(`Price is ${price} xRLC`);
  console.log(`Volume is ${volume}`);

  try {
    // Publish sell order for TEE app
    await publishSellOrder(iexec, appAddress, price, volume);
  } catch (e) {
    throw Error(`Failed to publish app sell order: ${e}`);
  }
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
