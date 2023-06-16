import { getIExec, loadAppAddress } from './utils/utils.js';
import { publishSellOrder } from './singleFunction/publishSellOrder.js';
import { resolveName } from './singleFunction/resolveName.js';
import {
  DRONE_TARGET_SELL_ORDER_DEV,
  DRONE_TARGET_SELL_ORDER_PROD,
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  WEB3_MAIL_ENS_NAME_DEV,
  WEB3_MAIL_ENS_NAME_PROD,
} from './config/config.js';
import { isUndefined, params } from './utils/validator.js';

const main = async () => {
  // get env variables from drone
  const {
    DRONE_DEPLOY_TO,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    PRICE,
  } = process.env;

  if (
    !DRONE_DEPLOY_TO ||
    ![
      DRONE_TARGET_DEPLOY_DEV,
      DRONE_TARGET_SELL_ORDER_DEV,
      DRONE_TARGET_DEPLOY_PROD,
      DRONE_TARGET_SELL_ORDER_PROD,
    ].includes(DRONE_DEPLOY_TO)
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  let privateKey;
  if (
    [DRONE_TARGET_DEPLOY_DEV, DRONE_TARGET_SELL_ORDER_DEV].includes(
      DRONE_DEPLOY_TO
    )
  ) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
  } else if (
    [DRONE_TARGET_DEPLOY_PROD, DRONE_TARGET_SELL_ORDER_PROD].includes(
      DRONE_DEPLOY_TO
    )
  ) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);

  const appAddress = await loadAppAddress().catch(() => {
    console.log('No app address found falling back to ENS');
    let ensName;
    if (DRONE_DEPLOY_TO === DRONE_TARGET_SELL_ORDER_DEV) {
      ensName = WEB3_MAIL_ENS_NAME_DEV;
    } else if (DRONE_DEPLOY_TO === DRONE_TARGET_SELL_ORDER_PROD) {
      ensName = WEB3_MAIL_ENS_NAME_PROD;
    }
    if (!ensName)
      throw Error(`Failed to get ens name for target ${DRONE_DEPLOY_TO}`);
    return resolveName(iexec, ensName);
  });

  if (!appAddress) throw Error('Failed to get app address'); // If the app was not deployed, do not continue

  // validate params
  params().validate(PRICE);

  if (isUndefined(PRICE)) {
    console.log(
      'No price set for the app sell order, using default price 0 RLC'
    );
    try {
      //publish sell order for Tee app (scone)
      await publishSellOrder(iexec, appAddress);
    } catch (e) {
      throw Error('Failed to publish free sell order');
    }
  } else {
    const priceValue = parseInt(PRICE);
    console.log('price in RLC for the app sell order :', priceValue);
    try {
      //publish sell order for Tee app (scone)
      await publishSellOrder(iexec, appAddress, priceValue * 10e9);
    } catch (e) {
      throw Error('Failed to publish paying sell order');
    }
  }
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
